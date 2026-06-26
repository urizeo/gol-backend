import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../entities/match.entity';
import { TransformedMatch } from '../transform/match.transformer';

@Injectable()
export class MatchRepository {
  private readonly logger = new Logger(MatchRepository.name);

  constructor(
    @InjectRepository(Match)
    private readonly repo: Repository<Match>,
  ) {}

  async upsertMany(matches: TransformedMatch[]): Promise<void> {
    await this.repo.query('PRAGMA foreign_keys = OFF');
    for (const match of matches) {
      const existing = await this.repo.findOne({ where: { id: match.id } });
      if (existing) {
        await this.repo.update(match.id, match);
      } else {
        await this.repo.save(match);
      }
    }
    await this.repo.query('PRAGMA foreign_keys = ON');
    this.logger.debug(`Upserted ${matches.length} matches`);
  }

  async updateScore(id: number, data: Partial<Match>): Promise<void> {
    await this.repo.update(id, data);
  }

  async findById(id: number): Promise<Match | null> {
    return this.repo.findOne({
      where: { id },
      relations: { homeTeam: true, awayTeam: true, group: true },
    });
  }

  async findByDate(date: string): Promise<Match[]> {
    return this.repo
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.homeTeam', 'homeTeam')
      .leftJoinAndSelect('match.awayTeam', 'awayTeam')
      .where('date(match.date) = date(:date)', { date })
      .orderBy('match.date', 'ASC')
      .getMany();
  }

  async findByStatus(statusState: string): Promise<Match[]> {
    return this.repo.find({
      where: { statusState },
      relations: { homeTeam: true, awayTeam: true },
      order: { date: 'ASC' },
    });
  }

  async findLive(): Promise<Match[]> {
    return this.findByStatus('in');
  }

  async findAll(): Promise<Match[]> {
    return this.repo.find({
      relations: { homeTeam: true, awayTeam: true, group: true },
      order: { date: 'ASC' },
    });
  }

  async findNextUpcomingMatch(afterDate: Date): Promise<Match | null> {
    return this.repo
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.homeTeam', 'homeTeam')
      .leftJoinAndSelect('match.awayTeam', 'awayTeam')
      .where('match.date > :afterDate', { afterDate })
      .andWhere('match.statusState = :status', { status: 'pre' })
      .orderBy('match.date', 'ASC')
      .limit(1)
      .getOne();
  }
}
