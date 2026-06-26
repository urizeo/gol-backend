import { Module } from '@nestjs/common';
import { EspnHttpClient } from './espn-http.client';
import { SiteApiExtractor } from './site-api.extractor';
import { CoreApiExtractor } from './core-api.extractor';

@Module({
  providers: [EspnHttpClient, SiteApiExtractor, CoreApiExtractor],
  exports: [EspnHttpClient, SiteApiExtractor, CoreApiExtractor],
})
export class ExtractModule {}
