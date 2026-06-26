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

@Entity('players')
export class Player {
  @PrimaryColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  shortName: string;

  @Column({ nullable: true })
  jersey: string;

  @Column({ nullable: true })
  positionName: string;

  @Column({ nullable: true })
  positionAbbr: string;

  @Column({ nullable: true })
  teamId: number;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Column({ type: 'real', nullable: true })
  height: number;

  @Column({ type: 'real', nullable: true })
  weight: number;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({ nullable: true })
  citizenship: string;

  @Column({ nullable: true })
  flagUrl: string;

  @Column({ type: 'datetime', nullable: true })
  lastSyncedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
