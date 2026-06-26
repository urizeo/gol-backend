import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchEvent } from '../../entities/match-event.entity';
import { MatchPlay } from '../../entities/match-play.entity';

export interface TransformedEvent {
  matchId: number;
  type: string;
  clockDisplay?: string;
  clockValue: number;
  period: number;
  homeScore: number;
  awayScore: number;
  description?: string;
  playerId?: number;
  teamId?: number;
  secondaryPlayerId?: number;
  jersey?: string;
  wallclock?: string;
}

@Injectable()
export class MatchEventRepository {
  private readonly logger = new Logger(MatchEventRepository.name);

  constructor(
    @InjectRepository(MatchEvent)
    private readonly repo: Repository<MatchEvent>,
  ) {}

  async upsertMany(events: TransformedEvent[]): Promise<void> {
    for (const event of events) {
      const where: Record<string, unknown> = {
        matchId: event.matchId,
        type: event.type,
        clockValue: event.clockValue,
      };
      if (event.playerId != null) {
        where.playerId = event.playerId;
      }
      const existing = await this.repo.findOne({ where });
      if (!existing) {
        await this.repo.save(event);
      }
    }
  }

  async findByMatchId(matchId: number): Promise<MatchEvent[]> {
    return this.repo.find({
      where: { matchId },
      relations: { player: true, team: true, secondaryPlayer: true },
      order: { clockValue: 'ASC', id: 'ASC' },
    });
  }

  async existsForPlay(
    matchId: number,
    type: string,
    clockValue: number,
    playerId?: number,
  ): Promise<boolean> {
    const where: Record<string, unknown> = { matchId, type, clockValue };
    if (playerId != null) {
      where.playerId = playerId;
    }
    const count = await this.repo.count({ where });
    return count > 0;
  }

  transformPlayToEvent(play: MatchPlay): TransformedEvent | null {
    let type: string | null = null;

    if (play.scoringPlay && play.ownGoal) {
      type = 'own_goal';
    } else if (play.scoringPlay && play.penaltyKick) {
      type = 'penalty_goal';
    } else if (play.scoringPlay) {
      type = 'goal';
    } else if (!play.scoringPlay && play.penaltyKick) {
      type = 'missed_penalty';
    } else if (play.yellowCard) {
      type = 'yellow_card';
    } else if (play.redCard) {
      type = 'red_card';
    } else if (play.typeSlug === 'substitution') {
      type = 'substitution';
    } else if (play.typeSlug === 'temp-goal') {
      type = 'temp_goal';
    } else if (play.typeSlug === 'temp-attempt') {
      type = 'temp_attempt';
    } else if (play.typeSlug === 'temp-card') {
      type = 'temp_card';
    }

    if (!type) return null;

    return {
      matchId: play.matchId,
      type,
      clockDisplay: play.clockDisplay,
      clockValue: play.clockValue,
      period: play.period,
      homeScore: play.homeScore,
      awayScore: play.awayScore,
      description: play.text,
      playerId: play.athleteId,
      teamId: play.teamId,
      jersey: play.jersey,
      wallclock: play.wallclock,
    };
  }

  async syncFromPlays(matchId: number, plays: MatchPlay[]): Promise<number> {
    const events: TransformedEvent[] = [];

    for (const play of plays) {
      const event = this.transformPlayToEvent(play);
      if (!event) continue;

      const exists = await this.existsForPlay(
        matchId,
        event.type,
        event.clockValue,
        event.playerId,
      );
      if (!exists) {
        events.push(event);
      }
    }

    if (events.length > 0) {
      await this.upsertMany(events);
    }

    return events.length;
  }
}
