import { Injectable, Logger } from '@nestjs/common';
import { TeamRepository } from '../etl/load/team.repository';
import { PlayerRepository } from '../etl/load/player.repository';
import { Team } from '../entities/team.entity';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    private teamRepo: TeamRepository,
    private playerRepo: PlayerRepository,
  ) {}

  async findAll(): Promise<Team[]> {
    return this.teamRepo.findAll();
  }

  async findOne(id: number): Promise<Team | null> {
    return this.teamRepo.findById(id);
  }

  async findPlayers(teamId: number) {
    return this.playerRepo.findByTeamId(teamId);
  }
}
