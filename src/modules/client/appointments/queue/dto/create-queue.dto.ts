import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaymentMode } from '../entities/queue.entity';

export class CreateQueueDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(PaymentMode)
  @IsNotEmpty()
  paymentMode: PaymentMode;
}
