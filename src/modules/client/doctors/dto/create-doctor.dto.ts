import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDoctorDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsString()
  @IsOptional()
  seating?: string;
}
