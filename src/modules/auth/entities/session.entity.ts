import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sessions')
@Index(['userId'])
export class Session {
  @PrimaryColumn({ type: 'uuid' })
  sessionId: string;

  @Column()
  userId: number;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ nullable: true })
  ipAddress: string | null;

  @Column({ nullable: true })
  userAgent: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
