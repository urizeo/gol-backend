import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../entities/match.entity';
import { MatchPlay } from '../entities/match-play.entity';
import { MatchEvent } from '../entities/match-event.entity';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchesGateway } from './matches.gateway';
import { LivePlayEmitterService } from './live-play-emitter.service';
import { LoadModule } from '../etl/load/load.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, MatchPlay, MatchEvent]),
    LoadModule,
  ],
  controllers: [MatchesController],
  providers: [MatchesService, MatchesGateway, LivePlayEmitterService],
  exports: [MatchesService, MatchesGateway, LivePlayEmitterService],
})
export class MatchesModule {}
