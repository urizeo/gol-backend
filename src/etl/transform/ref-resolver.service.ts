import { Injectable, Logger } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { EspnHttpClient } from '../extract/espn-http.client';

@Injectable()
export class RefResolverService {
  private readonly logger = new Logger(RefResolverService.name);
  private readonly cache: LRUCache<string, any>;

  constructor(private http: EspnHttpClient) {
    this.cache = new LRUCache({
      max: 2000,
      ttl: 1000 * 60 * 60 * 24, // 24 hours
    });
  }

  async resolve<T = any>(ref: string | { $ref?: string }): Promise<T | null> {
    const refUrl = typeof ref === 'string' ? ref : ref?.$ref;
    if (!refUrl) return null;

    const cached = this.cache.get(refUrl);
    if (cached !== undefined) return cached as T;

    try {
      const data = await this.http.getRaw(refUrl);
      this.cache.set(refUrl, data);
      return data as T;
    } catch (error: any) {
      this.logger.warn(`Failed to resolve $ref: ${refUrl} (${error.message})`);
      return null;
    }
  }

  hasRef(obj: any): boolean {
    return obj && typeof obj === 'object' && '$ref' in obj;
  }

  extractIdFromRef(ref: string | { $ref?: string }): number | null {
    const refUrl = typeof ref === 'string' ? ref : ref?.$ref;
    if (!refUrl) return null;

    const match = refUrl.match(/\/(\d+)(?:\?|$)/);
    return match ? parseInt(match[1], 10) : null;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
