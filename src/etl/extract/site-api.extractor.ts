import { Injectable, Logger } from '@nestjs/common';
import { EspnHttpClient } from './espn-http.client';

const SITE_API_BASE =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

@Injectable()
export class SiteApiExtractor {
  private readonly logger = new Logger(SiteApiExtractor.name);

  constructor(private http: EspnHttpClient) {}

  async getScoreboard(date?: string): Promise<any> {
    const url = date
      ? `${SITE_API_BASE}/scoreboard?dates=${date}`
      : `${SITE_API_BASE}/scoreboard`;
    this.logger.log(`Fetching scoreboard${date ? ` for ${date}` : ' (today)'}`);
    return this.http.getRaw(url);
  }

  async getMatchSummary(eventId: number): Promise<any> {
    const url = `${SITE_API_BASE}/summary?event=${eventId}`;
    this.logger.log(`Fetching summary for event ${eventId}`);
    return this.http.getRaw(url);
  }

  async getTeamRoster(teamId: number): Promise<any> {
    const url = `${SITE_API_BASE}/teams/${teamId}/roster`;
    this.logger.log(`Fetching roster for team ${teamId}`);
    return this.http.getRaw(url);
  }

  async getTeamSchedule(teamId: number): Promise<any> {
    const url = `${SITE_API_BASE}/teams/${teamId}/schedule`;
    this.logger.log(`Fetching schedule for team ${teamId}`);
    return this.http.getRaw(url);
  }
}
