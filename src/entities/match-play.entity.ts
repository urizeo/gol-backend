import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Match } from './match.entity';
import { Player } from './player.entity';
import { Team } from './team.entity';

@Entity('match_plays')
export class MatchPlay {
  @PrimaryColumn()
  id: number;

  @Column()
  matchId: number;

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match: Match;

  @Column({ nullable: true })
  typeId: string;

  @Column({ nullable: true })
  typeName: string;

  @Column({ nullable: true })
  typeSlug: string;

  @Column({ nullable: true })
  text: string;

  @Column({ type: 'real', default: 0 })
  clockValue: number;

  @Column({ nullable: true })
  clockDisplay: string;

  @Column({ default: 0 })
  period: number;

  @Column({ default: 0 })
  homeScore: number;

  @Column({ default: 0 })
  awayScore: number;

  @Column({ default: false })
  scoringPlay: boolean;

  @Column({ default: false })
  yellowCard: boolean;

  @Column({ default: false })
  redCard: boolean;

  @Column({ default: false })
  penaltyKick: boolean;

  @Column({ default: false })
  ownGoal: boolean;

  @Column({ nullable: true })
  wallclock: string;

  @Column({ nullable: true })
  athleteId: number;

  @ManyToOne(() => Player, { nullable: true })
  @JoinColumn({ name: 'athleteId' })
  athlete: Player;

  @Column({ nullable: true })
  teamId: number;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Column({ nullable: true })
  jersey: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
