import {
  PaymentProvider,
  PaymentReferenceType,
  PaymentStatus,
} from '@repo/store';
import { BaseEntity } from 'src/common/entity/base.entity';
import { Entity, Column, Index } from 'typeorm';

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
