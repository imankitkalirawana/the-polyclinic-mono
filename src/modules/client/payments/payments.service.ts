import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { BaseTenantService } from '../../tenancy/base-tenant.service';
import { CONNECTION } from '../../tenancy/tenancy.symbols';
import { TenantAuthInitService } from '../../tenancy/tenant-auth-init.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { Payment, PaymentStatus } from './entities/payment.entity';
import {
  Queue,
  QueueStatus,
} from '../appointments/queue/entities/queue.entity';
import { RazorpayService } from './razorpay.service';
import { ApiResponse } from 'src/common/response-wrapper';

@Injectable()
export class PaymentsService extends BaseTenantService {
  constructor(
    @Inject(REQUEST) request: Request,
    @Inject(CONNECTION) connection: DataSource | null,
    tenantAuthInitService: TenantAuthInitService,
    private readonly razorpayService: RazorpayService,
  ) {
    super(request, connection, tenantAuthInitService, PaymentsService.name);
  }

  async verifyPayment(dto: VerifyPaymentDto) {
    await this.ensureTablesExist();
    const paymentRepo = this.getRepository(Payment);
    const queueRepo = this.getRepository(Queue);

    const payment = await paymentRepo.findOne({
      where: { orderId: dto.orderId },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    const isValid = this.razorpayService.verifySignature(
      dto.orderId,
      dto.paymentId,
      dto.signature,
    );

    if (!isValid) {
      payment.status = PaymentStatus.FAILED;
      await paymentRepo.save(payment);
      throw new BadRequestException('Invalid payment signature');
    }

    payment.paymentId = dto.paymentId;
    payment.signature = dto.signature;
    payment.status = PaymentStatus.PAID;

    await paymentRepo.save(payment);

    await queueRepo.update(
      { paymentId: payment.id },
      { status: QueueStatus.BOOKED },
    );

    return ApiResponse.success(
      null,
      'Payment verified and appointment confirmed',
    );
  }

  async handleWebhookEvent(webhookPayload: any) {
    await this.ensureTablesExist();
    const paymentRepo = this.getRepository(Payment);
    const queueRepo = this.getRepository(Queue);

    const event = webhookPayload.event;

    if (event === 'payment.captured') {
      await this.handlePaymentCaptured(webhookPayload, paymentRepo, queueRepo);
    } else if (event === 'payment.failed') {
      await this.handlePaymentFailed(webhookPayload, paymentRepo);
    } else {
      this.logger.log(`Ignoring unknown webhook event: ${event}`);
    }
  }

  private async handlePaymentCaptured(
    webhookPayload: any,
    paymentRepo: any,
    queueRepo: any,
  ) {
    const paymentData = webhookPayload.payload.payment.entity;
    const orderId = paymentData.order_id;

    if (!orderId) {
      this.logger.warn('Payment captured event missing order_id');
      return;
    }

    const payment = await paymentRepo.findOne({
      where: { orderId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for orderId: ${orderId}`);
      return;
    }

    if (payment.status === PaymentStatus.PAID) {
      this.logger.log(`Payment already PAID for orderId: ${orderId}`);
      return;
    }

    payment.paymentId = paymentData.id;
    payment.status = PaymentStatus.PAID;

    await paymentRepo.save(payment);

    await queueRepo.update(
      { paymentId: payment.id },
      { status: QueueStatus.BOOKED },
    );

    this.logger.log(
      `Payment captured and appointment confirmed for orderId: ${orderId}`,
    );
  }

  private async handlePaymentFailed(webhookPayload: any, paymentRepo: any) {
    const paymentData = webhookPayload.payload.payment.entity;
    const orderId = paymentData.order_id;

    if (!orderId) {
      this.logger.warn('Payment failed event missing order_id');
      return;
    }

    const payment = await paymentRepo.findOne({
      where: { orderId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for orderId: ${orderId}`);
      return;
    }

    payment.paymentId = paymentData.id;
    payment.status = PaymentStatus.FAILED;

    await paymentRepo.save(payment);

    this.logger.log(`Payment failed for orderId: ${orderId}`);
  }
}
