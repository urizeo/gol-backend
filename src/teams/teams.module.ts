import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../entities/team.entity';
import { Player } from '../entities/player.entity';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { LoadModule } from '../etl/load/load.module';

@Module({
  imports: [TypeOrmModule.forFeature([Team, Player]), LoadModule],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
