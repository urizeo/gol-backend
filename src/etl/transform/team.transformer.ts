import { Injectable } from '@nestjs/common';
import { FlagResolverService } from './flag-resolver.service';

export interface RawEspnTeam {
  id: number | string;
  name?: string;
  displayName?: string;
  abbreviation?: string;
  color?: string;
  alternateColor?: string;
  logos?: Array<{ href: string; rel?: string[]; width?: number }>;
  slug?: string;
  form?: string;
  isNational?: boolean;
}

export interface TransformedTeam {
  id: number;
  name: string;
  abbreviation: string;
  displayName: string;
  color?: string;
  alternateColor?: string;
  logoUrl?: string;
  darkLogoUrl?: string;
  slug?: string;
  form?: string;
  isNational: boolean;
}

@Injectable()
export class TeamTransformer {
  constructor(private readonly flagResolver: FlagResolverService) {}

  transform(raw: RawEspnTeam): TransformedTeam {
    return {
      id: Number(raw.id),
      name: raw.name || raw.displayName || 'Unknown',
      abbreviation: raw.abbreviation || 'N/A',
      displayName: raw.displayName || raw.name || 'Unknown',
      color: raw.color || undefined,
      alternateColor: raw.alternateColor || undefined,
      logoUrl: this.extractLogo(raw.logos, 'default') || undefined,
      darkLogoUrl: this.extractLogo(raw.logos, 'dark') || undefined,
      slug: raw.slug || undefined,
      form: raw.form || undefined,
      isNational: raw.isNational ?? true,
    };
  }

  transformMany(rawTeams: RawEspnTeam[]): TransformedTeam[] {
    return rawTeams.map((team) => this.transform(team));
  }

  private extractLogo(logos: any[] | undefined, rel: string): string | null {
    if (!logos || !Array.isArray(logos)) return null;
    const logo = logos.find((l) => l.rel?.includes(rel));
    const href = logo?.href || null;
    return href ? this.flagResolver.resolveFlagUrl(href) : null;
  }
}
