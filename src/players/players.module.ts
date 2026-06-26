import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '../entities/player.entity';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { LoadModule } from '../etl/load/load.module';

@Module({
  imports: [TypeOrmModule.forFeature([Player]), LoadModule],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
