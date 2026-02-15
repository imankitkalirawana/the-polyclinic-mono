import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Gender } from '@repo/store';

export class UpdatePatientDto {
  // age
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(150)
  age?: number;

  // gender
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  dob?: string | Date;

  @IsString()
  @IsOptional()
  address?: string;
}
