import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import Razorpay = require('razorpay');
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private readonly razorpay: Razorpay;
  private readonly logger = new Logger(RazorpayService.name);

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  /**
   * Create Razorpay order
   * @param amount Amount in paise
   * @param receipt Receipt for the order
   */
  async createOrder(amount: number, receipt: string) {
    try {
      return await this.razorpay.orders.create({
        amount, // convert to paise
        currency: 'INR',
        receipt,
        payment_capture: true,
      });
    } catch (error) {
      this.logger.error('Failed to create Razorpay order', error);
      throw new InternalServerErrorException(
        'Failed to create Razorpay order',
        error,
      );
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  verifySignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const payload = `${orderId}|${paymentId}`;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Verify Razorpay webhook signature
   */
  verifyWebhookSignature(payload: Buffer, signature: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      this.logger.error('RAZORPAY_WEBHOOK_SECRET is not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature),
    );
  }

  /**
   * Get order details from Razorpay
   */
  async getOrder(orderId: string) {
    try {
      return await this.razorpay.orders.fetch(orderId);
    } catch (error) {
      this.logger.error('Failed to fetch Razorpay order', error);
      throw error;
    }
  }
}
