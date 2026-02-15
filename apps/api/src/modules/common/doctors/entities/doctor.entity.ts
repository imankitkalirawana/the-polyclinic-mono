import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@auth/entities/user.entity';
import { Specialization } from './specialization.entity';

@Entity('doctor_doctors', { schema: 'public' })
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 3, nullable: true })
  code?: string | null;

  @Column({ type: 'uuid', unique: true })
  @Index()
  user_id: string;

  @OneToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  designation?: string;

  @Column({ nullable: true })
  seating?: string;

  @ManyToMany(() => Specialization, (specialization) => specialization.doctors)
  @JoinTable({
    name: 'doctor_doctor_specializations',
    joinColumn: {
      name: 'doctor_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'specialization_id',
      referencedColumnName: 'id',
    },
  })
  specializations: Specialization[];

  @Column({ type: 'integer', nullable: true })
  experience?: number;

  @Column({ type: 'text', nullable: true })
  education?: string;

  @Column({ type: 'text', nullable: true })
  biography?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt: Date | null;
}
