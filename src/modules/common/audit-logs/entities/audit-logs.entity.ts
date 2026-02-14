import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ItemType {
  USER = 'User',
  PATIENT = 'Patient',
  DOCTOR = 'Doctor',
  COMPANY = 'Company',
  QUEUE = 'Queue',
  PAYMENT = 'Payment',
}

export enum Event {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SOFT_DELETE = 'SOFT_DELETE',
  RESTORE = 'RESTORE',
}

export enum ActorType {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

export type ObjectChanges = {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};

/**
 * Table name only; schema comes from the DataSource (public vs tenant).
 * Ensures tenant-scoped operations write to their schema's audit_logs.
 * Does not extend BaseEntity so we do not have deletedAt (audit logs are append-only).
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  item_id: string | null;

  @Column({
    type: 'enum',
    enum: ItemType,
  })
  item_type: ItemType;

  @Column({
    type: 'enum',
    enum: Event,
  })
  event: Event;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  actor_id: string | null;

  @Column({
    type: 'enum',
    enum: ActorType,
    default: ActorType.SYSTEM,
  })
  actor_type: ActorType;

  @Column({ type: 'jsonb', nullable: true })
  object_changes: ObjectChanges | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  request_id: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  source: string | null;
}
