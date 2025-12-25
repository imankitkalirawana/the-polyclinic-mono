import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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
}
