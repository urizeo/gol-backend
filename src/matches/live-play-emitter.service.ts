import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchesGateway } from './matches.gateway';
import { MatchRepository } from '../etl/load/match.repository';
import { MatchPlay } from '../entities/match-play.entity';

interface TimelineBufferItem {
  play: MatchPlay;
  emitAt: number;
}

@Injectable()
export class LivePlayEmitterService implements OnModuleDestroy {
  private readonly logger = new Logger(LivePlayEmitterService.name);
  private readonly timelineDelayMs: number;
  private readonly timelineBuffers = new Map<number, TimelineBufferItem[]>();
  private timelineTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private config: ConfigService,
    private gateway: MatchesGateway,
    private matchRepo: MatchRepository,
  ) {
    this.timelineDelayMs = this.config.get<number>('timelineDelayMs', 10000);
  }

  onNewPlays(matchId: number, plays: MatchPlay[]): void {
    if (plays.length === 0) return;

    const rawClients = this.gateway.getRawSubscribers(matchId);
    const timelineClients = this.gateway.getTimelineSubscribers(matchId);

    if (rawClients.size > 0) {
      this.emitRawPlays(matchId, plays, rawClients);
    }

    if (timelineClients.size > 0) {
      this.bufferTimelinePlays(matchId, plays);
    }
  }

  clearBuffer(matchId: number): void {
    this.timelineBuffers.delete(matchId);
    this.stopTimerIfIdle();
  }

  onModuleDestroy(): void {
    this.stopTimer();
  }

  private emitRawPlays(
    matchId: number,
    plays: MatchPlay[],
    clients: Set<string>,
  ): void {
    for (const play of plays) {
      this.gateway.emitNewPlay(matchId, play, clients);
    }
  }

  private bufferTimelinePlays(matchId: number, plays: MatchPlay[]): void {
    const now = Date.now();
    const items: TimelineBufferItem[] = plays.map((play) => ({
      play,
      emitAt: this.calculateEmitAt(play, now),
    }));

    items.sort((a, b) => a.emitAt - b.emitAt);

    const existing = this.timelineBuffers.get(matchId) || [];
    const merged = [...existing, ...items].sort((a, b) => a.emitAt - b.emitAt);
    this.timelineBuffers.set(matchId, merged);

    this.startTimerIfNeeded();
  }

  private calculateEmitAt(play: MatchPlay, now: number): number {
    if (play.wallclock) {
      const wallclockMs = new Date(play.wallclock).getTime();
      if (!isNaN(wallclockMs)) {
        const emitAt = wallclockMs + this.timelineDelayMs;
        return emitAt > now ? emitAt : now;
      }
    }
    return now + this.timelineDelayMs;
  }

  private startTimerIfNeeded(): void {
    if (this.timelineTimer) return;

    this.timelineTimer = setInterval(() => {
      this.processTimelineBuffer();
    }, 100);
  }

  private stopTimer(): void {
    if (this.timelineTimer) {
      clearInterval(this.timelineTimer);
      this.timelineTimer = null;
    }
  }

  private stopTimerIfIdle(): void {
    if (this.timelineBuffers.size === 0) {
      this.stopTimer();
    }
  }

  private processTimelineBuffer(): void {
    const now = Date.now();

    for (const [matchIdStr, items] of this.timelineBuffers) {
      const matchId = Number(matchIdStr);
      const timelineClients = this.gateway.getTimelineSubscribers(matchId);

      if (timelineClients.size === 0) continue;

      const ready: TimelineBufferItem[] = [];
      const remaining: TimelineBufferItem[] = [];

      for (const item of items) {
        if (now >= item.emitAt) {
          ready.push(item);
        } else {
          remaining.push(item);
        }
      }

      if (remaining.length > 0) {
        this.timelineBuffers.set(matchId, remaining);
      } else {
        this.timelineBuffers.delete(matchId);
      }

      for (const item of ready) {
        this.gateway.emitNewPlay(matchId, item.play, timelineClients);
        void this.emitTimelineMatchUpdate(matchId, timelineClients);
      }
    }

    this.stopTimerIfIdle();
  }

  private async emitTimelineMatchUpdate(
    matchId: number,
    clients: Set<string>,
  ): Promise<void> {
    try {
      const match = await this.matchRepo.findById(matchId);
      if (match) {
        this.gateway.emitMatchUpdate(matchId, match, clients);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to fetch match ${matchId} for timeline update: ${message}`,
      );
    }
  }
}
