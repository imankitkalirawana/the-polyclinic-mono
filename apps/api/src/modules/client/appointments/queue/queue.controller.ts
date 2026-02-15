import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Res,
  Logger,
  Req,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { CreateQueueDto, createQueueSchema } from '@repo/store';
import { BearerAuthGuard } from '@auth/guards/bearer-auth.guard';
import { RolesGuard } from '@auth/guards/roles.guard';
import { FieldRestrictionsGuard } from '@auth/guards/field-restrictions.guard';
import { Roles } from '@auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@auth/decorators/current-user.decorator';
import { CompleteQueueDto, completeQueueSchema } from '@repo/store';
import { VerifyPaymentDto, verifyPaymentSchema } from '@repo/store';
import { Response } from 'express';
import { StandardParam, StandardParams } from 'nest-standard-response';
import { formatQueue } from './queue.helper';
import { Request } from 'express';
import { PaymentMode, UserRole } from '@repo/store';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';

@Controller('client/appointments/queue')
@UseGuards(BearerAuthGuard, RolesGuard, FieldRestrictionsGuard)
export class QueueController {
  private readonly logger = new Logger(QueueController.name);
  constructor(private readonly queueService: QueueService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PATIENT)
  async create(
    @StandardParam() params: StandardParams,
    @Body(ZodValidationPipe.create(createQueueSchema))
    createQueueDto: CreateQueueDto,
  ) {
    const queue = await this.queueService.create(createQueueDto);

    params.setMessage(`Your appointment has been booked`);

    if (queue && createQueueDto.paymentMode === PaymentMode.RAZORPAY) {
      const payment = await this.queueService.createPayment(queue.id);

      return {
        ...queue,
        payment,
      };
    }
    return queue;
  }

  @Post('verify-payment')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PATIENT)
  verifyPayment(
    @Body(ZodValidationPipe.create(verifyPaymentSchema))
    verifyPaymentDto: VerifyPaymentDto,
  ) {
    return this.queueService.verifyPayment(verifyPaymentDto);
  }

  @Get('all')
  @Roles(
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT,
  )
  async findAll(@Query('view_id') view_id: string) {
    const result = await this.queueService.find_all_by_view(view_id);

    return result;
  }

  @Get('doctor/:doctorId/queue')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  getQueueForDoctor(
    @Param('doctorId') doctorId: string,
    @Query('id') queueId?: string,
    @Query('date') date?: string,
  ) {
    const queue = this.queueService.getQueueForDoctor({
      doctorId,
      queueId,
      appointmentDate: date ? new Date(date) : new Date(),
    });
    return queue;
  }

  @Get('patient/me')
  @Roles(
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT,
  )
  getQueueForPatient() {
    return this.queueService.getQueueForPatient();
  }

  @Get(':aid')
  @Roles(
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT,
  )
  async getAppointmentByAid(@Param('aid') aid: string, @Req() req: Request) {
    const queue = await this.queueService.getAppointmentByAid(aid);
    return formatQueue(queue, req.user.role);
  }

  @Get(':id/activity-logs')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  async getActivityLogs(@Param('id') id: string) {
    return this.queueService.getActivityLogs(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.queueService.remove(id);
  }

  @Patch(':id/call')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  callQueue(@StandardParam() params: StandardParams, @Param('id') id: string) {
    params.setMessage(`Patient has been called`);
    return this.queueService.callQueue(id);
  }

  @Patch(':id/clock-in')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  clockIn(@StandardParam() params: StandardParams, @Param('id') id: string) {
    params.setMessage(`Appointment started`);
    return this.queueService.clockIn(id);
  }

  @Patch(':id/skip')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  skipQueue(@StandardParam() params: StandardParams, @Param('id') id: string) {
    params.setMessage(`Patient has been temporarily skipped`);
    return this.queueService.skipQueue(id);
  }

  @Patch(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  completeAppointmentQueue(
    @StandardParam() params: StandardParams,
    @Param('id') id: string,
    @Body(ZodValidationPipe.create(completeQueueSchema))
    completeQueueDto: CompleteQueueDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    params.setMessage(`Appointment Completed`);
    return this.queueService.completeAppointmentQueue(
      id,
      completeQueueDto,
      user,
    );
  }

  @Get('receipt/:id')
  async appointmentReceiptPdf(@Param('id') id: string, @Res() res: Response) {
    const { pdf, metaData } = await this.queueService.appointmentReceiptPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=${metaData.filename}`,
      'Content-Length': pdf.length,
      'Content-Title': metaData.title,
    });

    res.end(pdf);
  }
}
