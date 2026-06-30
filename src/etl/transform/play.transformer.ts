import { Injectable, Logger } from '@nestjs/common';

export interface RawEspnPlay {
  id: number | string;
  type?: { id?: string; text?: string; type?: string };
  text?: string;
  shortText?: string;
  clock?: { value?: number; displayValue?: string };
  period?: { number?: number };
  homeScore?: number;
  awayScore?: number;
  scoringPlay?: boolean;
  yellowCard?: boolean;
  redCard?: boolean;
  penaltyKick?: boolean;
  ownGoal?: boolean;
  wallclock?: string;
  participants?: Array<{
    jersey?: string;
    athlete?: { $ref?: string; id?: number | string };
    team?: { $ref?: string; id?: number | string };
  }>;
}

const REF_ID_RE = /\/(\d+)(?:\?|$)/;

function extractIdFromRef(
  obj: { $ref?: string; id?: number | string } | undefined,
): number | undefined {
  if (!obj) return undefined;
  if (obj.id != null) return Number(obj.id);
  if (obj.$ref) {
    const match = obj.$ref.match(REF_ID_RE);
    return match ? parseInt(match[1], 10) : undefined;
  }
  return undefined;
}

export interface TransformedPlay {
  id: number;
  matchId: number;
  typeId?: string;
  typeName?: string;
  typeSlug?: string;
  text?: string;
  clockValue: number;
  clockDisplay?: string;
  period: number;
  homeScore: number;
  awayScore: number;
  scoringPlay: boolean;
  yellowCard: boolean;
  redCard: boolean;
  penaltyKick: boolean;
  ownGoal: boolean;
  wallclock?: string;
  athleteId?: number;
  teamId?: number;
  jersey?: string;
}

@Injectable()
export class PlayTransformer {
  private readonly logger = new Logger(PlayTransformer.name);

  transform(raw: RawEspnPlay, matchId: number): TransformedPlay | null {
    if (!raw?.id) return null;

    const participant = raw.participants?.[0];

    return {
      id: Number(raw.id),
      matchId,
      typeId: raw.type?.id || undefined,
      typeName: raw.type?.text || undefined,
      typeSlug: raw.type?.type || undefined,
      text: raw.text || raw.shortText || undefined,
      clockValue: raw.clock?.value || 0,
      clockDisplay: raw.clock?.displayValue || undefined,
      period: raw.period?.number || 0,
      homeScore: raw.homeScore || 0,
      awayScore: raw.awayScore || 0,
      scoringPlay: raw.scoringPlay ?? false,
      yellowCard: raw.yellowCard ?? false,
      redCard: raw.redCard ?? false,
      penaltyKick: raw.penaltyKick ?? false,
      ownGoal: raw.ownGoal ?? false,
      wallclock: raw.wallclock || undefined,
      athleteId: extractIdFromRef(participant?.athlete),
      teamId: extractIdFromRef(participant?.team),
      jersey: participant?.jersey || undefined,
    };
  }

  transformMany(rawPlays: RawEspnPlay[], matchId: number): TransformedPlay[] {
    return rawPlays
      .map((play) => this.transform(play, matchId))
      .filter((p): p is TransformedPlay => p !== null);
  }

  extractSignificantPlays(plays: TransformedPlay[]): TransformedPlay[] {
    return plays.filter(
      (p) =>
        p.scoringPlay ||
        p.yellowCard ||
        p.redCard ||
        p.penaltyKick ||
        p.ownGoal ||
        p.typeSlug === 'substitution' ||
        p.typeSlug === 'var-review' ||
        p.typeSlug === 'kickoff' ||
        p.typeSlug === 'halftime' ||
        p.typeSlug === 'fulltime',
    );
  }
}
