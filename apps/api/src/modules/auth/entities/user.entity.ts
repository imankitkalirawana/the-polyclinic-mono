import { Entity, Column, OneToMany, Index, DeleteDateColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base.entity';
import { CompanyType } from './company.entity';
import type { Session } from './session.entity';
import { UserRole } from '@repo/store';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export enum AuthSource {
  CREDENTIALS = 'CREDENTIALS',
  GOOGLE = 'GOOGLE',
}

@Entity('login_users', { schema: 'public' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_digest: string;

  @Column({ type: 'varchar', default: UserRole.PATIENT })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'varchar', default: CompanyType.CLIENT })
  @Index()
  company_type: CompanyType;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ type: 'enum', enum: AuthSource, default: AuthSource.CREDENTIALS })
  auth_source: AuthSource;

  @Column({ type: 'varchar', length: 100, default: 'Asia/Kolkata' })
  time_zone: string;

  @Column({ type: 'jsonb', default: {} })
  permissions: Record<string, unknown>;

  /**
   * List of tenant schema slugs this user can access (normalized lowercase).
   * Example: ['app', 'demo']
   *
   * NOTE: In production, prefer adding a migration and a GIN index.
   */
  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  companies: string[];

  @OneToMany('Session', 'user')
  sessions: Session[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
