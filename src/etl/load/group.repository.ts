import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../../entities/group.entity';

@Injectable()
export class GroupRepository {
  private readonly logger = new Logger(GroupRepository.name);

  constructor(
    @InjectRepository(Group)
    private readonly repo: Repository<Group>,
  ) {}

  async upsertMany(
    groups: Array<{ id: number; name: string; abbreviation?: string }>,
  ): Promise<void> {
    const now = new Date();
    for (const group of groups) {
      const existing = await this.repo.findOne({ where: { id: group.id } });
      if (existing) {
        await this.repo.update(group.id, {
          name: group.name,
          abbreviation: group.abbreviation || group.name,
          lastSyncedAt: now,
        });
      } else {
        await this.repo.save({
          id: group.id,
          name: group.name,
          abbreviation: group.abbreviation || group.name,
          lastSyncedAt: now,
        });
      }
    }
    this.logger.debug(`Upserted ${groups.length} groups`);
  }

  async isDataFresh(maxAgeMs: number): Promise<boolean> {
    const count = await this.repo.count();
    if (count === 0) return false;
    const result = await this.repo
      .createQueryBuilder('grp')
      .select('MIN(grp.lastSyncedAt)', 'oldest')
      .getRawOne();
    if (!result?.oldest) return false;
    return Date.now() - new Date(result.oldest).getTime() < maxAgeMs;
  }

  async findById(id: number): Promise<Group | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(): Promise<Group[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }
}
