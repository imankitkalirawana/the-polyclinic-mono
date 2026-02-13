import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base.entity';

export enum ItemType {
  USER = 'User',
  PATIENT = 'Patient',
  DOCTOR = 'Doctor',
  COMPANY = 'Company',
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

@Entity('audit_logs', { schema: 'public' })
export class AuditLog extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  @Index()
  item_id: string | null;

  @Column({ type: 'enum', enum: ItemType })
  item_type: ItemType;

  @Column({ type: 'enum', enum: Event })
  event: Event;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  actor_id: string | null;

  @Column({ type: 'enum', enum: ActorType, default: ActorType.SYSTEM })
  actor_type: ActorType;

  @Column({ type: 'jsonb', nullable: true })
  object_changes: Record<string, any> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  request_id: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  source: string | null;
}
