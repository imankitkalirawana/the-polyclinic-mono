import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserDto } from '@/auth/users/dto/create-user.dto';
import {
  UpdateDoctorProfileDto,
  UpdatePatientProfileDto,
} from './update-profile.dto';

/**
 * User creation payload for the unified "create profile" flow.
 * Reuses the existing CreateUserDto (email, name, password, role, etc.).
 */
export class CreateUserProfileDto extends CreateUserDto {}

/**
 * Unified create profile DTO: base user fields + optional role-specific block.
 * Frontend sends base fields plus exactly one of doctor or patient based on user.role.
 */
export class CreateProfileDto {
  @ValidateNested()
  @Type(() => CreateUserProfileDto)
  user: CreateUserProfileDto;

  @ValidateNested()
  @Type(() => UpdateDoctorProfileDto)
  @IsOptional()
  doctor?: UpdateDoctorProfileDto;

  @ValidateNested()
  @Type(() => UpdatePatientProfileDto)
  @IsOptional()
  patient?: UpdatePatientProfileDto;
}

