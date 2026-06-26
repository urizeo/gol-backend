import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../../entities/player.entity';
import { TransformedPlayer } from '../transform/player.transformer';

@Injectable()
export class PlayerRepository {
  private readonly logger = new Logger(PlayerRepository.name);

  constructor(
    @InjectRepository(Player)
    private readonly repo: Repository<Player>,
  ) {}

  async upsertMany(players: TransformedPlayer[]): Promise<void> {
    await this.repo.query('PRAGMA foreign_keys = OFF');
    const now = new Date();
    for (const player of players) {
      const existing = await this.repo.findOne({ where: { id: player.id } });
      if (existing) {
        await this.repo.update(player.id, { ...player, lastSyncedAt: now });
      } else {
        await this.repo.save({ ...player, lastSyncedAt: now });
      }
    }
    await this.repo.query('PRAGMA foreign_keys = ON');
    this.logger.debug(`Upserted ${players.length} players`);
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async isDataFresh(maxAgeMs: number): Promise<boolean> {
    const count = await this.repo.count();
    if (count === 0) return false;
    const result = await this.repo
      .createQueryBuilder('player')
      .select('MIN(player.lastSyncedAt)', 'oldest')
      .getRawOne();
    if (!result?.oldest) return false;
    return Date.now() - new Date(result.oldest).getTime() < maxAgeMs;
  }

  async findById(id: number): Promise<Player | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByTeamId(teamId: number): Promise<Player[]> {
    return this.repo.find({ where: { teamId }, order: { jersey: 'ASC' } });
  }
}
