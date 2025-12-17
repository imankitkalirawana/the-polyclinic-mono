import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { Gender } from '../entities/patient.entity';

export class CreatePatientDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(150)
  age?: number;

  @IsString()
  @IsOptional()
  address?: string;
}
