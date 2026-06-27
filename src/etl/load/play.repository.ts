import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { MatchPlay } from '../../entities/match-play.entity';
import { TransformedPlay } from '../transform/play.transformer';

@Injectable()
export class PlayRepository {
  private readonly logger = new Logger(PlayRepository.name);

  constructor(
    @InjectRepository(MatchPlay)
    private readonly repo: Repository<MatchPlay>,
  ) {}

  async upsertMany(plays: TransformedPlay[]): Promise<void> {
    for (const play of plays) {
      const existing = await this.repo.findOne({ where: { id: play.id } });
      if (existing) {
        await this.repo.update(play.id, play);
      } else {
        await this.repo.save(play);
      }
    }
    this.logger.debug(`Upserted ${plays.length} plays`);
  }

  async findByMatchId(matchId: number): Promise<MatchPlay[]> {
    return this.repo.find({
      where: { matchId },
      relations: { athlete: true, team: true },
      order: { clockValue: 'ASC', id: 'ASC' },
    });
  }

  async findNewPlays(
    matchId: number,
    afterPlayId: number,
  ): Promise<MatchPlay[]> {
    return this.repo.find({
      where: {
        matchId,
        id: MoreThan(afterPlayId),
      },
      relations: { athlete: true, team: true },
      order: { id: 'ASC' },
    });
  }

  async findSignificantPlays(matchId: number): Promise<MatchPlay[]> {
    return this.repo
      .createQueryBuilder('play')
      .leftJoinAndSelect('play.athlete', 'athlete')
      .leftJoinAndSelect('play.team', 'team')
      .where('play.matchId = :matchId', { matchId })
      .andWhere(
        '(play.scoringPlay = 1 OR play.yellowCard = 1 OR play.redCard = 1 OR play.penaltyKick = 1 OR play.ownGoal = 1 OR play.typeSlug IN (:...slugs))',
        {
          slugs: [
            'substitution',
            'var-review',
            'kickoff',
            'halftime',
            'fulltime',
          ],
        },
      )
      .orderBy('play.clockValue', 'ASC')
      .getMany();
  }

  async findMaxPlayId(matchId: number): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('play')
      .select('MAX(play.id)', 'maxId')
      .where('play.matchId = :matchId', { matchId })
      .getRawOne();
    return result?.maxId || 0;
  }

  async deleteByMatchId(matchId: number): Promise<void> {
    await this.repo.delete({ matchId });
    this.logger.debug(`Deleted plays for match ${matchId}`);
  }

  async countByMatchId(matchId: number): Promise<number> {
    return this.repo.count({ where: { matchId } });
  }

  async findById(id: number): Promise<MatchPlay | null> {
    return this.repo.findOne({
      where: { id },
      relations: { athlete: true, team: true },
    });
  }

  async findExistingPlays(
    matchId: number,
    playIds: number[],
  ): Promise<MatchPlay[]> {
    if (playIds.length === 0) return [];
    return this.repo
      .createQueryBuilder('play')
      .leftJoinAndSelect('play.athlete', 'athlete')
      .leftJoinAndSelect('play.team', 'team')
      .where('play.matchId = :matchId', { matchId })
      .andWhere('play.id IN (:...playIds)', { playIds })
      .getMany();
  }

  async deleteOrphanedPlays(
    matchId: number,
    apiPlayIds: number[],
  ): Promise<number> {
    if (apiPlayIds.length === 0) return 0;
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('matchId = :matchId', { matchId })
      .andWhere('id NOT IN (:...apiPlayIds)', { apiPlayIds })
      .execute();
    const deleted = result?.affected || 0;
    if (deleted > 0) {
      this.logger.log(
        `Deleted ${deleted} orphaned plays for match ${matchId}`,
      );
    }
    return deleted;
  }

  async deletePlaysForEndedMatches(): Promise<void> {
    const result = await this.repo.query(
      'DELETE FROM match_plays WHERE matchId IN (SELECT id FROM matches WHERE statusState = ?)',
      ['post'],
    );
    const deleted = result?.changes || 0;
    this.logger.log(`Deleted ${deleted} plays for ended matches`);
  }
}
