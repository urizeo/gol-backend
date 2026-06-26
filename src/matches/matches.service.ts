import { Injectable, Logger } from '@nestjs/common';
import { MatchRepository } from '../etl/load/match.repository';
import { PlayRepository } from '../etl/load/play.repository';
import { MatchEventRepository } from '../etl/load/match-event.repository';
import { Match } from '../entities/match.entity';
import { MatchPlay } from '../entities/match-play.entity';
import { MatchEvent } from '../entities/match-event.entity';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private matchRepo: MatchRepository,
    private playRepo: PlayRepository,
    private matchEventRepo: MatchEventRepository,
  ) {}

  async findAll(status?: string, date?: string): Promise<Match[]> {
    if (status) {
      return this.matchRepo.findByStatus(status);
    }
    if (date) {
      return this.matchRepo.findByDate(date);
    }
    return this.matchRepo.findAll();
  }

  async findOne(id: number): Promise<Match | null> {
    return this.matchRepo.findById(id);
  }

  async findPlays(
    matchId: number,
    significantOnly = false,
  ): Promise<MatchPlay[]> {
    if (significantOnly) {
      return this.playRepo.findSignificantPlays(matchId);
    }
    return this.playRepo.findByMatchId(matchId);
  }

  async findEvents(matchId: number): Promise<MatchEvent[]> {
    return this.matchEventRepo.findByMatchId(matchId);
  }

  async findLive(): Promise<Match[]> {
    return this.matchRepo.findLive();
  }

  async findPlayById(id: number): Promise<MatchPlay | null> {
    return this.playRepo.findById(id);
  }
}
