import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Team } from './team.entity';
import { Group } from './group.entity';

@Entity('matches')
export class Match {
  @PrimaryColumn()
  id: number;

  @Column()
  date: Date;

  @Column()
  name: string;

  @Column({ nullable: true })
  shortName: string;

  @Column({ nullable: true })
  homeTeamId: number;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'homeTeamId' })
  homeTeam: Team;

  @Column({ nullable: true })
  awayTeamId: number;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'awayTeamId' })
  awayTeam: Team;

  @Column({ default: 0 })
  homeScore: number;

  @Column({ default: 0 })
  awayScore: number;

  @Column({ nullable: true })
  statusId: string;

  @Column({ nullable: true })
  statusName: string;

  @Column({ nullable: true })
  statusState: string;

  @Column({ nullable: true })
  statusDescription: string;

  @Column({ nullable: true })
  statusDetail: string;

  @Column({ type: 'real', default: 0 })
  clock: number;

  @Column({ nullable: true })
  displayClock: string;

  @Column({ default: 0 })
  period: number;

  @Column({ nullable: true })
  attendance: number;

  @Column({ nullable: true })
  matchNumber: number;

  @Column({ nullable: true })
  seasonTypeId: number;

  @Column({ nullable: true })
  groupId: number;

  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column({ default: false })
  homeTeamWinner: boolean;

  @Column({ default: false })
  awayTeamWinner: boolean;

  @Column({ default: false })
  homeTeamAdvance: boolean;

  @Column({ default: false })
  awayTeamAdvance: boolean;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
