import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../../entities/team.entity';
import { Player } from '../../entities/player.entity';
import { Group } from '../../entities/group.entity';
import { Match } from '../../entities/match.entity';
import { MatchPlay } from '../../entities/match-play.entity';
import { TeamRepository } from './team.repository';
import { PlayerRepository } from './player.repository';
import { GroupRepository } from './group.repository';
import { MatchRepository } from './match.repository';
import { PlayRepository } from './play.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Team, Player, Group, Match, MatchPlay])],
  providers: [
    TeamRepository,
    PlayerRepository,
    GroupRepository,
    MatchRepository,
    PlayRepository,
  ],
  exports: [
    TeamRepository,
    PlayerRepository,
    GroupRepository,
    MatchRepository,
    PlayRepository,
  ],
})
export class LoadModule {}
