import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

@Injectable()
export class EspnHttpClient {
  private readonly logger = new Logger(EspnHttpClient.name);
  private readonly client: AxiosInstance;
  private readonly requestDelay: number;
  private lastRequestTime = 0;

  constructor(private config: ConfigService) {
    this.requestDelay = this.config.get<number>('ESPN_REQUEST_DELAY_MS', 200);
    this.client = axios.create({
      timeout: 15000,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Referer: 'https://www.espn.com/',
        Origin: 'https://www.espn.com',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        Connection: 'keep-alive',
      },
    });
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    await this.enforceRateLimit();

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.get<T>(url, config);
        this.logger.debug(`GET ${url} → ${response.status}`);
        return response.data;
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;

        if (status === 429) {
          const retryAfter = parseInt(
            error.response?.headers?.['retry-after'] || '60',
            10,
          );
          this.logger.warn(`Rate limited on ${url}. Waiting ${retryAfter}s...`);
          await this.sleep(retryAfter * 1000);
          continue;
        }

        if (status === 404) {
          this.logger.warn(`Not found: ${url}`);
          throw error;
        }

        if (attempt < maxRetries) {
          const backoff = attempt * 1000;
          this.logger.warn(
            `Request failed (${status || error.message}). Retry ${attempt}/${maxRetries} in ${backoff}ms`,
          );
          await this.sleep(backoff);
        }
      }
    }

    this.logger.error(`Failed after ${maxRetries} attempts: ${url}`);
    throw lastError;
  }

  async getRaw(url: string): Promise<any> {
    return this.get<any>(url);
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.requestDelay) {
      await this.sleep(this.requestDelay - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
