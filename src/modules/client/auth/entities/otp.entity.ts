import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum OtpType {
  registration = 'REGISTRATION',
  forgotPassword = 'FORGOT_PASSWORD',
  verification = 'VERIFICATION',
}

@Entity('otps')
@Index(['email', 'code'])
@Index(['email', 'verified'])
@Index(['expiresAt'])
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  code: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ type: 'enum', enum: OtpType })
  type: OtpType;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
