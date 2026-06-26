import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('teams')
export class Team {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  abbreviation: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  alternateColor: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  darkLogoUrl: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ nullable: true })
  form: string;

  @Column({ default: true })
  isNational: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastSyncedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
