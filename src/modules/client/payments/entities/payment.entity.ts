import { BaseEntity } from 'src/common/entity/base.entity';
import { Entity, Column, Index } from 'typeorm';

/**
 * Payment Provider
 */
export enum PaymentProvider {
  RAZORPAY = 'RAZORPAY',
  CASH = 'CASH',
}

/**
 * Payment Status
 */
export enum PaymentStatus {
  CREATED = 'CREATED',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export enum PaymentReferenceType {
  APPOINTMENT_QUEUE = 'APPOINTMENT_QUEUE',
}

@Entity({ name: 'payments' })
@Index(['referenceType', 'referenceId'])
export class Payment extends BaseEntity {
  /**
   * Generic reference (appointment / event / etc)
   */
  @Column({
    type: 'enum',
    enum: PaymentReferenceType,
  })
  referenceType: PaymentReferenceType;

  @Column({ type: 'uuid' })
  referenceId: string;
  /**
   * Payment provider (Razorpay / Cash)
   */
  @Column({
    type: 'enum',
    enum: PaymentProvider,
  })
  provider: PaymentProvider;

  /**
   * Razorpay Order ID
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  orderId: string | null;

  /**
   * Razorpay Payment ID
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentId: string | null;

  /**
   * Razorpay Signature
   */
  @Column({ type: 'varchar', length: 512, nullable: true })
  signature: string | null;

  /**
   * Amount in paise (INR)
   */
  @Column({ type: 'int' })
  amount: number;

  /**
   * Currency
   */
  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  /**
   * Payment status
   */
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.CREATED,
  })
  status: PaymentStatus;
}
