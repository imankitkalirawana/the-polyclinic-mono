import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { BearerAuthGuard } from '@auth/guards/bearer-auth.guard';
import { RolesGuard } from '@auth/guards/roles.guard';
import { VerifyPaymentDto, verifyPaymentSchema } from '@repo/store';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';

@Controller('client/payments')
@UseGuards(BearerAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('verify')
  async verifyPayment(
    @Body(ZodValidationPipe.create(verifyPaymentSchema)) dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(dto);
  }
}
