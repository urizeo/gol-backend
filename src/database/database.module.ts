import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Team } from '../entities/team.entity';
import { Player } from '../entities/player.entity';
import { Group } from '../entities/group.entity';
import { Match } from '../entities/match.entity';
import { MatchPlay } from '../entities/match-play.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DB_PATH', './data/scoreboard.db'),
        entities: [Team, Player, Group, Match, MatchPlay],
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
