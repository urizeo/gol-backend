import { Injectable, Logger } from '@nestjs/common';
import * as fifaToIso from './fifa-to-iso.json';

const FLAGCDN_BASE = 'https://flagcdn.com/w160';
const ESPN_COUNTRIES_PATTERN =
  /espncdn\.com\/i\/teamlogos\/countries\/\d+\/(\w+)\.png/;

@Injectable()
export class FlagResolverService {
  private readonly logger = new Logger(FlagResolverService.name);
  private readonly mapping: Record<string, string>;

  constructor() {
    this.mapping = fifaToIso;
    this.logger.log(
      `FlagResolver loaded ${Object.keys(this.mapping).length} FIFA→ISO mappings`,
    );
  }

  resolveFlagUrl(url: string): string {
    if (!url) return url;

    const match = url.match(ESPN_COUNTRIES_PATTERN);
    if (!match) return url;

    const fifaCode = match[1].toLowerCase();
    const isoCode = this.mapping[fifaCode];

    if (!isoCode) {
      this.logger.debug(
        `No ISO mapping for FIFA code "${fifaCode}", keeping original URL`,
      );
      return url;
    }

    return `${FLAGCDN_BASE}/${isoCode}.png`;
  }
}
