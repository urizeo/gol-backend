import { Module } from '@nestjs/common';
import { ExtractModule } from './extract/espn-http.module';
import { TransformModule } from './transform/transform.module';
import { LoadModule } from './load/load.module';
import { EtlOrchestrator } from './orchestrator.service';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [ExtractModule, TransformModule, LoadModule, MatchesModule],
  providers: [EtlOrchestrator],
  exports: [EtlOrchestrator],
})
export class EtlModule {}
