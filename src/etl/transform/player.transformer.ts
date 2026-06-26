import { Injectable } from '@nestjs/common';

export interface RawEspnAthlete {
  id: number | string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  displayName?: string;
  shortName?: string;
  jersey?: string;
  position?:
    | { $ref?: string; id?: string; name?: string; abbreviation?: string }
    | string;
  team?: { $ref?: string } | { id?: number | string };
  height?: number;
  displayHeight?: string;
  weight?: number;
  displayWeight?: string;
  age?: number;
  dateOfBirth?: string;
  citizenship?: string;
  flag?: { href?: string; alt?: string };
}

export interface TransformedPlayer {
  id: number;
  firstName: string;
  lastName: string;
  displayName: string;
  shortName?: string;
  jersey?: string;
  positionName?: string;
  positionAbbr?: string;
  teamId?: number;
  height?: number;
  weight?: number;
  age?: number;
  dateOfBirth?: string;
  citizenship?: string;
  flagUrl?: string;
}

@Injectable()
export class PlayerTransformer {
  transform(
    raw: RawEspnAthlete,
    resolveRef?: (ref: any) => Promise<any>,
  ): TransformedPlayer {
    const pos = raw.position as any;
    const team = raw.team as any;

    return {
      id: Number(raw.id),
      firstName: raw.firstName || '',
      lastName: raw.lastName || '',
      displayName:
        raw.displayName ||
        `${raw.firstName || ''} ${raw.lastName || ''}`.trim(),
      shortName: raw.shortName || undefined,
      jersey: raw.jersey || undefined,
      positionName: pos?.name || undefined,
      positionAbbr: pos?.abbreviation || undefined,
      teamId: team?.id ? Number(team.id) : undefined,
      height: raw.height || undefined,
      weight: raw.weight || undefined,
      age: raw.age || undefined,
      dateOfBirth: raw.dateOfBirth || undefined,
      citizenship: raw.citizenship || undefined,
      flagUrl: raw.flag?.href || undefined,
    };
  }

  transformMany(
    rawAthletes: RawEspnAthlete[],
    resolveRef?: (ref: any) => Promise<any>,
  ): TransformedPlayer[] {
    return rawAthletes.map((athlete) => this.transform(athlete, resolveRef));
  }
}
