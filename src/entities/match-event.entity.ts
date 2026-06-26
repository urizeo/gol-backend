import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Match } from './match.entity';
import { Player } from './player.entity';
import { Team } from './team.entity';

@Entity('match_events')
export class MatchEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  matchId: number;

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match: Match;

  @Column()
  type: string;

  @Column({ nullable: true })
  clockDisplay: string;

  @Column({ type: 'real', default: 0 })
  clockValue: number;

  @Column({ default: 0 })
  period: number;

  @Column({ default: 0 })
  homeScore: number;

  @Column({ default: 0 })
  awayScore: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  playerId: number;

  @ManyToOne(() => Player, { nullable: true })
  @JoinColumn({ name: 'playerId' })
  player: Player;

  @Column({ nullable: true })
  teamId: number;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Column({ nullable: true })
  secondaryPlayerId: number;

  @ManyToOne(() => Player, { nullable: true })
  @JoinColumn({ name: 'secondaryPlayerId' })
  secondaryPlayer: Player;

  @Column({ nullable: true })
  jersey: string;

  @Column({ nullable: true })
  wallclock: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
