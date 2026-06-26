import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../../entities/team.entity';
import { TransformedTeam } from '../transform/team.transformer';

@Injectable()
export class TeamRepository {
  private readonly logger = new Logger(TeamRepository.name);

  constructor(
    @InjectRepository(Team)
    private readonly repo: Repository<Team>,
  ) {}

  async upsertMany(teams: TransformedTeam[]): Promise<void> {
    const now = new Date();
    for (const team of teams) {
      const existing = await this.repo.findOne({ where: { id: team.id } });
      if (existing) {
        await this.repo.update(team.id, { ...team, lastSyncedAt: now });
      } else {
        await this.repo.save({ ...team, lastSyncedAt: now });
      }
    }
    this.logger.debug(`Upserted ${teams.length} teams`);
  }

  async isDataFresh(maxAgeMs: number): Promise<boolean> {
    const count = await this.repo.count();
    if (count === 0) return false;
    const result = await this.repo
      .createQueryBuilder('team')
      .select('MIN(team.lastSyncedAt)', 'oldest')
      .getRawOne();
    if (!result?.oldest) return false;
    return Date.now() - new Date(result.oldest).getTime() < maxAgeMs;
  }

  async findById(id: number): Promise<Team | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(): Promise<Team[]> {
    return this.repo.find({ order: { displayName: 'ASC' } });
  }
}
