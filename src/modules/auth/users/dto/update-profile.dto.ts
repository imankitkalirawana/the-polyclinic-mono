import {
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, Vitals } from '@common/patients/entities/patient.entity';

/**
 * Base user fields shared across all roles (matches "Update a User" form).
 */
export class UpdateUserProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

/**
 * Doctor-specific profile fields (shown when role is Doctor).
 */
export class UpdateDoctorProfileDto {
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
  education?: string;

  @IsOptional()
  experience?: number;

  @IsString()
  @IsOptional()
  biography?: string;

  @IsString()
  @IsOptional()
  seating?: string;
}

/**
 * Patient-specific profile fields (shown when role is Patient).
 */
export class UpdatePatientProfileDto {
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsOptional()
  dob?: string | Date;

  @IsString()
  @IsOptional()
  address?: string;

  @IsObject()
  @IsOptional()
  // TODO: validate the items inside vitals also
  vitals?: Vitals;
}

/**
 * Unified profile update DTO: base user fields + optional role-specific block.
 * Frontend sends base fields plus exactly one of doctor or patient based on user.role.
 */
export class UpdateProfileDto {
  @ValidateNested()
  @Type(() => UpdateUserProfileDto)
  @IsOptional()
  user?: UpdateUserProfileDto;

  @ValidateNested()
  @Type(() => UpdateDoctorProfileDto)
  @IsOptional()
  doctor?: UpdateDoctorProfileDto;

  @ValidateNested()
  @Type(() => UpdatePatientProfileDto)
  @IsOptional()
  patient?: UpdatePatientProfileDto;
}
