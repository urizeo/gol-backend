import { Injectable, Logger } from '@nestjs/common';
import { PlayerRepository } from '../etl/load/player.repository';

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);

  constructor(private playerRepo: PlayerRepository) {}

  async findOne(id: number) {
    return this.playerRepo.findById(id);
  }
}
