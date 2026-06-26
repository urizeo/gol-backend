import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../../entities/team.entity';
import { Player } from '../../entities/player.entity';
import { Group } from '../../entities/group.entity';
import { Match } from '../../entities/match.entity';
import { MatchPlay } from '../../entities/match-play.entity';
import { MatchEvent } from '../../entities/match-event.entity';
import { TeamRepository } from './team.repository';
import { PlayerRepository } from './player.repository';
import { GroupRepository } from './group.repository';
import { MatchRepository } from './match.repository';
import { PlayRepository } from './play.repository';
import { MatchEventRepository } from './match-event.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Team,
      Player,
      Group,
      Match,
      MatchPlay,
      MatchEvent,
    ]),
  ],
  providers: [
    TeamRepository,
    PlayerRepository,
    GroupRepository,
    MatchRepository,
    PlayRepository,
    MatchEventRepository,
  ],
  exports: [
    TeamRepository,
    PlayerRepository,
    GroupRepository,
    MatchRepository,
    PlayRepository,
    MatchEventRepository,
  ],
})
export class LoadModule {}
