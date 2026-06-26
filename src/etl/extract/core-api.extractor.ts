import { Injectable, Logger } from '@nestjs/common';
import { EspnHttpClient } from './espn-http.client';

const CORE_API_BASE =
  'https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world';

@Injectable()
export class CoreApiExtractor {
  private readonly logger = new Logger(CoreApiExtractor.name);

  constructor(private http: EspnHttpClient) {}

  async getAllTeams(): Promise<any> {
    const url = `${CORE_API_BASE}/teams?limit=200`;
    this.logger.log('Fetching all teams');
    return this.http.getRaw(url);
  }

  async getTeamDetail(teamId: number): Promise<any> {
    const url = `${CORE_API_BASE}/seasons/2026/teams/${teamId}`;
    this.logger.log(`Fetching team detail ${teamId}`);
    return this.http.getRaw(url);
  }

  async getMatchEvent(eventId: number): Promise<any> {
    const url = `${CORE_API_BASE}/events/${eventId}`;
    this.logger.log(`Fetching event ${eventId}`);
    return this.http.getRaw(url);
  }

  async getMatchCompetition(eventId: number): Promise<any> {
    const url = `${CORE_API_BASE}/events/${eventId}/competitions/${eventId}`;
    this.logger.log(`Fetching competition ${eventId}`);
    return this.http.getRaw(url);
  }

  async getPlays(eventId: number, page = 1): Promise<any> {
    const url = `${CORE_API_BASE}/events/${eventId}/competitions/${eventId}/plays?limit=500&page=${page}`;
    this.logger.log(`Fetching plays for event ${eventId} (page ${page})`);
    return this.http.getRaw(url);
  }

  async getGroups(): Promise<any> {
    const url = `${CORE_API_BASE}/seasons/2026/types/1/groups`;
    this.logger.log('Fetching groups');
    return this.http.getRaw(url);
  }

  async getGroupDetail(groupId: number): Promise<any> {
    const url = `${CORE_API_BASE}/seasons/2026/types/1/groups/${groupId}`;
    this.logger.log(`Fetching group ${groupId}`);
    return this.http.getRaw(url);
  }

  async resolveRef(refUrl: string): Promise<any> {
    return this.http.getRaw(refUrl);
  }
}
