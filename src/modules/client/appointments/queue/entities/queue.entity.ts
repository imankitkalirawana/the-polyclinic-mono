import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patient } from '@/client/patients/entities/patient.entity';
import { Doctor } from '@/client/doctors/entities/doctor.entity';
import { TenantUser } from '@/client/auth/entities/tenant-user.entity';

export enum QueueStatus {
  BOOKED = 'BOOKED',
  CALLED = 'CALLED',
  IN_CONSULTATION = 'IN_CONSULTATION',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity('appointment_queue')
export class Queue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, (patient) => patient.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ type: 'enum', enum: QueueStatus, default: QueueStatus.BOOKED })
  status: QueueStatus;

  @Column({ type: 'uuid' })
  doctorId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @Column({ type: 'uuid', nullable: true })
  bookedBy: string;

  @ManyToOne(() => TenantUser, (user) => user.id, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'bookedBy' })
  bookedByUser: TenantUser;

  @Column({ type: 'int' })
  sequenceNumber: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
