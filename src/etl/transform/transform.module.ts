import { Module } from '@nestjs/common';
import { ExtractModule } from '../extract/espn-http.module';
import { RefResolverService } from './ref-resolver.service';
import { FlagResolverService } from './flag-resolver.service';
import { TeamTransformer } from './team.transformer';
import { PlayerTransformer } from './player.transformer';
import { MatchTransformer } from './match.transformer';
import { PlayTransformer } from './play.transformer';

@Module({
  imports: [ExtractModule],
  providers: [
    RefResolverService,
    FlagResolverService,
    TeamTransformer,
    PlayerTransformer,
    MatchTransformer,
    PlayTransformer,
  ],
  exports: [
    RefResolverService,
    FlagResolverService,
    TeamTransformer,
    PlayerTransformer,
    MatchTransformer,
    PlayTransformer,
  ],
})
export class TransformModule {}
