import { Injectable, Logger } from '@nestjs/common';

export interface RawEspnScoreboardEvent {
  id: number | string;
  date?: string;
  name?: string;
  shortName?: string;
  competitions?: any[];
  season?: any;
}

export interface RawEspnCompetition {
  id: number | string;
  date?: string;
  attendance?: number;
  competitors?: any[];
  status?: any;
  matchNumber?: number;
  groups?: any;
  format?: any;
}

export interface TransformedMatch {
  id: number;
  date: Date;
  name: string;
  shortName?: string;
  homeTeamId?: number;
  awayTeamId?: number;
  homeScore: number;
  awayScore: number;
  statusId?: string;
  statusName?: string;
  statusState?: string;
  statusDescription?: string;
  statusDetail?: string;
  clock: number;
  displayClock?: string;
  period: number;
  attendance?: number;
  matchNumber?: number;
  seasonTypeId?: number;
  groupId?: number;
  homeTeamWinner: boolean;
  awayTeamWinner: boolean;
  homeTeamAdvance: boolean;
  awayTeamAdvance: boolean;
}

@Injectable()
export class MatchTransformer {
  private readonly logger = new Logger(MatchTransformer.name);

  transformFromScoreboard(
    event: RawEspnScoreboardEvent,
  ): TransformedMatch | null {
    if (!event?.id || !event?.competitions?.[0]) return null;

    const comp = event.competitions[0] as RawEspnCompetition;
    const competitors = comp.competitors || [];

    const home = competitors.find((c: any) => c.homeAway === 'home');
    const away = competitors.find((c: any) => c.homeAway === 'away');

    const status = comp.status || event.season?.type;

    return {
      id: Number(event.id),
      date: new Date(event.date || comp.date || Date.now()),
      name: event.name || 'TBD',
      shortName: event.shortName || undefined,
      homeTeamId: home?.id ? Number(home.id) : undefined,
      awayTeamId: away?.id ? Number(away.id) : undefined,
      homeScore: this.parseScore(home?.score),
      awayScore: this.parseScore(away?.score),
      statusId: status?.type?.id?.toString() || undefined,
      statusName: status?.type?.name || undefined,
      statusState: status?.type?.state || undefined,
      statusDescription: status?.type?.description || undefined,
      statusDetail:
        status?.type?.detail || status?.type?.shortDetail || undefined,
      clock: status?.displayClock ? this.parseClock(status.displayClock) : 0,
      displayClock: status?.displayClock || undefined,
      period: status?.period || 0,
      attendance: comp.attendance || undefined,
      matchNumber: comp.matchNumber || undefined,
      seasonTypeId: event.season?.type?.id
        ? Number(event.season.type.id)
        : undefined,
      groupId: this.extractGroupId(comp.groups),
      homeTeamWinner: home?.winner ?? false,
      awayTeamWinner: away?.winner ?? false,
      homeTeamAdvance: home?.advance ?? false,
      awayTeamAdvance: away?.advance ?? false,
    };
  }

  transformFromSummary(summary: any): TransformedMatch | null {
    if (!summary) return null;

    const header = summary.header;
    const competitions = header?.competitions;
    if (!competitions?.[0]) return null;

    const comp = competitions[0];
    const competitors = comp.competitors || [];

    const home = competitors.find((c: any) => c.homeAway === 'home');
    const away = competitors.find((c: any) => c.homeAway === 'away');

    return {
      id: Number(comp.id || header.id),
      date: new Date(comp.date || header.date),
      name: header.name || comp.name || 'TBD',
      shortName: header.shortName || comp.shortName || undefined,
      homeTeamId: home?.id ? Number(home.id) : undefined,
      awayTeamId: away?.id ? Number(away.id) : undefined,
      homeScore: this.parseScore(home?.score),
      awayScore: this.parseScore(away?.score),
      statusId: comp.status?.type?.id?.toString() || undefined,
      statusName: comp.status?.type?.name || undefined,
      statusState: comp.status?.type?.state || undefined,
      statusDescription: comp.status?.type?.description || undefined,
      statusDetail: comp.status?.type?.detail || undefined,
      clock: comp.status?.displayClock
        ? this.parseClock(comp.status.displayClock)
        : 0,
      displayClock: comp.status?.displayClock || undefined,
      period: comp.status?.period || 0,
      attendance: comp.attendance || undefined,
      matchNumber: comp.matchNumber || undefined,
      seasonTypeId: undefined,
      groupId: this.extractGroupId(comp.group),
      homeTeamWinner: home?.winner ?? false,
      awayTeamWinner: away?.winner ?? false,
      homeTeamAdvance: home?.team?.advance ?? false,
      awayTeamAdvance: away?.team?.advance ?? false,
    };
  }

  private parseScore(score: any): number {
    if (typeof score === 'number') return score;
    if (typeof score === 'string') return parseInt(score, 10) || 0;
    return 0;
  }

  private parseClock(displayClock: string): number {
    const match = displayClock.match(/(\d+)'/);
    if (match) return parseInt(match[1], 10) * 60;
    const fullMatch = displayClock.match(/(\d+)'\+(\d+)'/);
    if (fullMatch)
      return (parseInt(fullMatch[1], 10) + parseInt(fullMatch[2], 10)) * 60;
    return 0;
  }

  private extractGroupId(groups: any): number | undefined {
    if (!groups) return undefined;
    if (typeof groups === 'number') return groups;
    if (typeof groups === 'string') return parseInt(groups, 10);
    if (groups.id) return Number(groups.id);
    if (groups.$ref) {
      const match = groups.$ref.match(/\/groups\/(\d+)/);
      return match ? parseInt(match[1], 10) : undefined;
    }
    return undefined;
  }
}
