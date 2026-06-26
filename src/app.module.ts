import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { EtlModule } from './etl/etl.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { MatchesModule } from './matches/matches.module';
import { TeamsModule } from './teams/teams.module';
import { PlayersModule } from './players/players.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    EtlModule,
    SchedulerModule,
    MatchesModule,
    TeamsModule,
    PlayersModule,
  ],
})
export class AppModule {}
