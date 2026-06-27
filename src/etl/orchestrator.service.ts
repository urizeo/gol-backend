import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SiteApiExtractor } from './extract/site-api.extractor';
import { CoreApiExtractor } from './extract/core-api.extractor';
import { TeamTransformer } from './transform/team.transformer';
import { PlayerTransformer } from './transform/player.transformer';
import { MatchTransformer } from './transform/match.transformer';
import { PlayTransformer } from './transform/play.transformer';
import { RefResolverService } from './transform/ref-resolver.service';
import { TeamRepository } from './load/team.repository';
import { PlayerRepository } from './load/player.repository';
import { GroupRepository } from './load/group.repository';
import { MatchRepository } from './load/match.repository';
import { PlayRepository } from './load/play.repository';
import { MatchEventRepository } from './load/match-event.repository';
import { LivePlayEmitterService } from '../matches/live-play-emitter.service';
import { MatchPlay } from '../entities/match-play.entity';
import { Match } from '../entities/match.entity';

@Injectable()
export class EtlOrchestrator {
  private readonly logger = new Logger(EtlOrchestrator.name);
  private readonly fullSyncIntervalMs: number;
  private previouslyLiveMatchIds = new Set<number>();

  constructor(
    private config: ConfigService,
    private siteApi: SiteApiExtractor,
    private coreApi: CoreApiExtractor,
    private teamTransformer: TeamTransformer,
    private playerTransformer: PlayerTransformer,
    private matchTransformer: MatchTransformer,
    private playTransformer: PlayTransformer,
    private refResolver: RefResolverService,
    private teamRepo: TeamRepository,
    private playerRepo: PlayerRepository,
    private groupRepo: GroupRepository,
    private matchRepo: MatchRepository,
    private playRepo: PlayRepository,
    private matchEventRepo: MatchEventRepository,
    private livePlayEmitter: LivePlayEmitterService,
  ) {
    this.fullSyncIntervalMs = this.config.get<number>(
      'fullSyncIntervalMs',
      86400000,
    );
  }

  async runFullSync(): Promise<void> {
    this.logger.log('Starting full sync...');

    try {
      await this.syncGroups();
      await this.syncTeams();
      await this.syncScoreboard(true);
      await this.syncPlayersForTodayTeams();

      this.logger.log('Full sync completed successfully');
    } catch (error: any) {
      this.logger.error(`Full sync failed: ${error.message}`, error.stack);
    }
  }

  async cleanupPastPlays(): Promise<void> {
    this.logger.log('Cleaning up plays for ended matches...');
    try {
      await this.playRepo.deletePlaysForEndedMatches();
    } catch (error: any) {
      this.logger.error(`Cleanup past plays failed: ${error.message}`);
    }
  }

  async hasLiveMatches(): Promise<boolean> {
    const live = await this.matchRepo.findLive();
    return live.length > 0;
  }

  async findNextUpcomingMatch(): Promise<Match | null> {
    return this.matchRepo.findNextUpcomingMatch(new Date());
  }

  async runHourlySync(): Promise<void> {
    this.logger.debug('Running hourly sync (scoreboard + roster)...');

    try {
      await this.syncScoreboard();
      await this.syncPlayersForTodayTeams();
      this.logger.debug('Hourly sync completed');
    } catch (error: any) {
      this.logger.error(`Hourly sync failed: ${error.message}`);
    }
  }

  async runLivePlaysPoll(): Promise<void> {
    try {
      await this.syncTodayScoreboard();

      const liveMatches = await this.matchRepo.findLive();
      const liveIds = new Set(liveMatches.map((m) => m.id));

      for (const match of liveMatches) {
        if (!this.previouslyLiveMatchIds.has(match.id)) {
          this.logger.log(`Match ${match.id} just went live: ${match.name}`);
          this.livePlayEmitter.emitMatchStarted(match.id, match);
        }
      }

      for (const match of liveMatches) {
        const { newPlays, processedIds } = await this.syncLivePlays(match.id);
        if (newPlays.length > 0) {
          this.livePlayEmitter.onNewPlays(match.id, newPlays);
          const newEvents = await this.matchEventRepo.syncFromPlays(
            match.id,
            newPlays,
          );
          if (newEvents > 0) {
            this.logger.debug(
              `Synced ${newEvents} new events for match ${match.id}`,
            );
          }
        }

        // Detect confirmed temp-goals: existing plays whose typeSlug changed to 'goal'
        const maxPlayId = await this.playRepo.findMaxPlayId(match.id);
        const existingIds = processedIds.filter((id) => id <= maxPlayId);
        if (existingIds.length > 0) {
          const existingPlays = await this.playRepo.findExistingPlays(
            match.id,
            existingIds,
          );
          const confirmedPlays = existingPlays.filter(
            (p) => p.typeSlug === 'goal',
          );
          if (confirmedPlays.length > 0) {
            await this.matchEventRepo.upgradeTempGoals(
              match.id,
              confirmedPlays,
            );
          }
        }
      }

      for (const prevId of this.previouslyLiveMatchIds) {
        if (!liveIds.has(prevId)) {
          this.logger.log(`Match ${prevId} ended, cleaning up plays`);
          await this.playRepo.deleteByMatchId(prevId);
          this.livePlayEmitter.clearBuffer(prevId);
        }
      }
      this.previouslyLiveMatchIds = liveIds;

      if (liveMatches.length > 0) {
        this.logger.debug(
          `Live plays poll: ${liveMatches.length} live match(es)`,
        );
      }
    } catch (error: any) {
      this.logger.error(`Live plays poll failed: ${error.message}`);
    }
  }

  private async syncGroups(): Promise<void> {
    if (await this.groupRepo.isDataFresh(this.fullSyncIntervalMs)) {
      this.logger.log('Groups data is fresh, skipping sync');
      return;
    }

    this.logger.log('Syncing groups...');

    const rawGroups = await this.coreApi.getGroups();
    const groups = (rawGroups?.items || [])
      .map((item: any) => {
        const id = this.refResolver.extractIdFromRef(item);
        return {
          id: id || 0,
          name: `Group ${String.fromCharCode(64 + (id || 0))}`,
          abbreviation: `Group ${String.fromCharCode(64 + (id || 0))}`,
        };
      })
      .filter((g: any) => g.id > 0);

    await this.groupRepo.upsertMany(groups);
    this.logger.log(`Synced ${groups.length} groups`);
  }

  private async syncTeams(): Promise<void> {
    if (await this.teamRepo.isDataFresh(this.fullSyncIntervalMs)) {
      this.logger.log('Teams data is fresh, skipping sync');
      return;
    }

    this.logger.log('Syncing teams...');

    const rawTeams = await this.coreApi.getAllTeams();
    const teamRefs = rawTeams?.items || [];

    const teams: any[] = [];
    for (const item of teamRefs) {
      const teamId = this.refResolver.extractIdFromRef(item);
      if (!teamId) continue;

      try {
        const rawTeam = await this.coreApi.getTeamDetail(teamId);
        teams.push(rawTeam);
      } catch (error: any) {
        this.logger.warn(`Failed to fetch team ${teamId}: ${error.message}`);
      }
    }

    const transformed = this.teamTransformer.transformMany(teams);
    await this.teamRepo.upsertMany(transformed);
    this.logger.log(`Synced ${transformed.length} teams`);
  }

  private async syncPlayersForTodayTeams(): Promise<void> {
    try {
      const todayMatches = await this.matchRepo.findByDate(
        new Date().toISOString().slice(0, 10),
      );

      const teamIds = new Set<number>();
      for (const match of todayMatches) {
        if (match.homeTeamId) teamIds.add(match.homeTeamId);
        if (match.awayTeamId) teamIds.add(match.awayTeamId);
      }

      if (teamIds.size === 0) {
        this.logger.debug("No teams in today's matches, skipping player sync");
        return;
      }

      const newTeams: number[] = [];
      for (const teamId of teamIds) {
        const existing = await this.playerRepo.findByTeamId(teamId);
        if (existing.length === 0) {
          newTeams.push(teamId);
        }
      }

      if (newTeams.length === 0) {
        this.logger.debug("All today's team rosters already synced");
        return;
      }

      this.logger.log(
        `Fetching rosters for ${newTeams.length} new team(s): ${newTeams.join(', ')}`,
      );

      for (const teamId of newTeams) {
        try {
          const rawRoster = await this.siteApi.getTeamRoster(teamId);
          const rosterAthletes = rawRoster?.athletes || [];
          const transformed =
            this.playerTransformer.transformMany(rosterAthletes);

          for (const player of transformed) {
            player.teamId = teamId;
          }

          await this.playerRepo.upsertMany(transformed);
          this.logger.log(
            `Synced ${transformed.length} players for team ${teamId}`,
          );
        } catch (error: any) {
          this.logger.warn(
            `Failed to fetch roster for team ${teamId}: ${error.message}`,
          );
        }
      }
    } catch (error: any) {
      this.logger.error(`Failed to sync team rosters: ${error.message}`);
    }
  }

  private async syncScoreboard(allDates = false): Promise<void> {
    try {
      if (allDates) {
        await this.syncAllMatchDates();
      } else {
        await this.syncTodayScoreboard();
      }
    } catch (error: any) {
      this.logger.error(`Failed to sync scoreboard: ${error.message}`);
    }
  }

  private async syncTodayScoreboard(): Promise<void> {
    this.logger.log('Syncing scoreboard (today)...');
    const rawScoreboard = await this.siteApi.getScoreboard();
    const events = rawScoreboard?.events || [];
    const matches = events
      .map((event: any) => this.matchTransformer.transformFromScoreboard(event))
      .filter((m: any) => m !== null);
    await this.matchRepo.upsertMany(matches);
    this.logger.log(`Synced ${matches.length} matches from scoreboard (today)`);
  }

  private async syncAllMatchDates(): Promise<void> {
    this.logger.log('Syncing all tournament matches (Jun 11 – Jul 19)...');

    const startDate = new Date('2026-06-11');
    const endDate = new Date('2026-07-19');
    let totalMatches = 0;

    for (
      const d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
      try {
        const rawScoreboard = await this.siteApi.getScoreboard(dateStr);
        const events = rawScoreboard?.events || [];
        const matches = events
          .map((event: any) =>
            this.matchTransformer.transformFromScoreboard(event),
          )
          .filter((m: any) => m !== null);
        if (matches.length > 0) {
          await this.matchRepo.upsertMany(matches);
          totalMatches += matches.length;
          this.logger.debug(`${dateStr}: ${matches.length} matches`);
        }
      } catch (error: any) {
        this.logger.warn(
          `Failed to fetch scoreboard for ${dateStr}: ${error.message}`,
        );
      }
    }

    this.logger.log(`Synced ${totalMatches} total tournament matches`);
  }

  private async syncLivePlays(
    matchId: number,
  ): Promise<{ newPlays: MatchPlay[]; processedIds: number[] }> {
    let newPlays: MatchPlay[] = [];
    const processedIds: number[] = [];
    try {
      const maxPlayId = await this.playRepo.findMaxPlayId(matchId);

      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const rawPlays = await this.coreApi.getPlays(matchId, page);
        const items = rawPlays?.items || [];
        const allPlays = this.playTransformer.transformMany(items, matchId);

        processedIds.push(...allPlays.map((p) => p.id));

        const pageNewPlays =
          maxPlayId > 0 ? allPlays.filter((p) => p.id > maxPlayId) : allPlays;

        if (pageNewPlays.length > 0) {
          await this.playRepo.upsertMany(pageNewPlays);
          this.logger.debug(
            `Loaded ${pageNewPlays.length} new plays for match ${matchId} (page ${page})`,
          );
        }

        hasMore = items.length >= 500;
        page++;
      }

      newPlays = await this.playRepo.findNewPlays(matchId, maxPlayId);
    } catch (error: any) {
      this.logger.warn(
        `Failed to sync plays for match ${matchId}: ${error.message}`,
      );
    }
    return { newPlays, processedIds };
  }
}
