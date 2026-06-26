import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EtlOrchestrator } from '../etl/orchestrator.service';

const MAX_IDLE_RETRIES = 15;
const ONE_MINUTE_MS = 60_000;
const TEN_MINUTES_MS = 600_000;

@Injectable()
export class PollService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PollService.name);
  private isLivePolling = false;
  private livePlaysTimer: ReturnType<typeof setTimeout> | null = null;
  private hourlySyncTimer: ReturnType<typeof setInterval> | null = null;
  private fullSyncTimer: ReturnType<typeof setInterval> | null = null;
  private consecutiveIdleChecks = 0;

  constructor(
    private config: ConfigService,
    private orchestrator: EtlOrchestrator,
  ) {}

  async onModuleInit(): Promise<void> {
    const hourlySyncIntervalMs = this.config.get<number>(
      'hourlySyncIntervalMs',
      3600000,
    );
    const fullSyncIntervalMs = this.config.get<number>(
      'fullSyncIntervalMs',
      86400000,
    );

    this.logger.log('Running initial full sync...');
    await this.orchestrator.runFullSync();
    await this.orchestrator.cleanupPastPlays();

    this.logger.log(
      `PollService initialized (hourly sync: ${hourlySyncIntervalMs}ms, full sync: ${fullSyncIntervalMs}ms)`,
    );

    this.scheduleNextPoll();

    this.hourlySyncTimer = setInterval(
      () => this.handleHourlySync(),
      hourlySyncIntervalMs,
    );
    this.fullSyncTimer = setInterval(
      () => this.handleDailySync(),
      fullSyncIntervalMs,
    );
  }

  onModuleDestroy(): void {
    if (this.livePlaysTimer) clearTimeout(this.livePlaysTimer);
    if (this.hourlySyncTimer) clearInterval(this.hourlySyncTimer);
    if (this.fullSyncTimer) clearInterval(this.fullSyncTimer);
  }

  private scheduleNextPoll(): void {
    if (this.livePlaysTimer) {
      clearTimeout(this.livePlaysTimer);
      this.livePlaysTimer = null;
    }

    this.orchestrator
      .hasLiveMatches()
      .then((hasLive) => {
        if (hasLive) {
          this.consecutiveIdleChecks = 0;
          this.logger.debug('Live matches found, scheduling poll in 10s');
          this.livePlaysTimer = setTimeout(
            () => this.pollAndReschedule(),
            10_000,
          );
          return;
        }

        this.orchestrator
          .findNextUpcomingMatch()
          .then((nextMatch) => {
            let delay: number;

            if (nextMatch) {
              const now = Date.now();
              const matchTime = new Date(nextMatch.date).getTime();
              const timeUntilStart = matchTime - now;

              if (timeUntilStart <= ONE_MINUTE_MS) {
                delay = 0;
                this.logger.log(
                  `Next match "${nextMatch.name}" starts soon, checking now`,
                );
              } else if (timeUntilStart <= TEN_MINUTES_MS + ONE_MINUTE_MS) {
                delay = timeUntilStart;
                const seconds = Math.round(delay / 1000);
                this.logger.log(
                  `Next match "${nextMatch.name}" in ${seconds}s, scheduling check`,
                );
              } else {
                delay = TEN_MINUTES_MS;
                this.logger.log(
                  `Next match "${nextMatch.name}" is far away, checking in 10min`,
                );
              }
            } else {
              delay = TEN_MINUTES_MS;
              this.logger.log('No upcoming matches, checking in 10min');
            }

            this.livePlaysTimer = setTimeout(
              () => this.pollAndReschedule(),
              delay,
            );
          })
          .catch(() => {
            this.livePlaysTimer = setTimeout(
              () => this.pollAndReschedule(),
              TEN_MINUTES_MS,
            );
          });
      })
      .catch(() => {
        this.livePlaysTimer = setTimeout(
          () => this.pollAndReschedule(),
          TEN_MINUTES_MS,
        );
      });
  }

  private async pollAndReschedule(): Promise<void> {
    if (this.isLivePolling) {
      this.scheduleNextPoll();
      return;
    }

    this.isLivePolling = true;
    try {
      await this.orchestrator.runLivePlaysPoll();
    } finally {
      this.isLivePolling = false;
    }

    const hasLive = await this.orchestrator.hasLiveMatches();

    if (hasLive) {
      this.consecutiveIdleChecks = 0;
      this.livePlaysTimer = setTimeout(() => this.pollAndReschedule(), 10_000);
    } else {
      this.consecutiveIdleChecks++;

      if (this.consecutiveIdleChecks < MAX_IDLE_RETRIES) {
        this.logger.debug(
          `No live matches, retry ${this.consecutiveIdleChecks}/${MAX_IDLE_RETRIES} in 1min`,
        );
        this.livePlaysTimer = setTimeout(
          () => this.pollAndReschedule(),
          ONE_MINUTE_MS,
        );
      } else {
        this.logger.log(
          `Max idle retries reached, falling back to 10min interval`,
        );
        this.consecutiveIdleChecks = 0;
        this.scheduleNextPoll();
      }
    }
  }

  private async handleHourlySync(): Promise<void> {
    this.logger.log('Running scheduled hourly sync...');
    await this.orchestrator.runHourlySync();
  }

  private async handleDailySync(): Promise<void> {
    this.logger.log('Running scheduled full sync...');
    await this.orchestrator.runFullSync();
  }

  async triggerFullSync(): Promise<void> {
    this.logger.log('Manual full sync triggered');
    await this.orchestrator.runFullSync();
  }
}
