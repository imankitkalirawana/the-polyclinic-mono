import {
  IsOptional,
  ValidateNested,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserDto } from '@/auth/users/dto/create-user.dto';
import {
  UpdateDoctorProfileDto,
  UpdatePatientProfileDto,
} from './update-profile.dto';
import { Role } from 'src/common/enums/role.enum';

/**
 * User creation payload for the unified "create profile" flow.
 * Reuses the existing CreateUserDto (email, name, password, role, etc.).
 */
export class CreateUserProfileDto extends CreateUserDto {}

/**
 * Ensures that when creating a user:
 * - If role is DOCTOR, a doctor profile block is provided (and patient is not).
 * - If role is PATIENT, a patient profile block is provided (and doctor is not).
 */
@ValidatorConstraint({ name: 'ProfileRoleConsistency', async: false })
export class ProfileRoleConsistencyConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const value = args.object as CreateProfileDto;
    if (!value?.user?.role) {
      // Role not set – let other validations handle it (or allow generic user).
      return true;
    }

    if (value.user.role === Role.DOCTOR) {
      return !!value.doctor && !value.patient;
    }

    if (value.user.role === Role.PATIENT) {
      return !!value.patient && !value.doctor;
    }

    // For other roles, we don't require doctor/patient blocks,
    // and they should not be sent either.
    return !value.doctor && !value.patient;
  }

  defaultMessage(args: ValidationArguments): string {
    const value = args.object as CreateProfileDto | undefined;
    const role = value?.user?.role;

    if (role === Role.DOCTOR) {
      return 'doctor profile details are required when role is DOCTOR ';
    }

    if (role === Role.PATIENT) {
      return 'patient profile details are required when role is PATIENT';
    }

    return 'doctor/patient profile details are only allowed when role is DOCTOR or PATIENT';
  }
}

/**
 * Unified create profile DTO: base user fields + optional role-specific block,
 * with validation linking user.role to the required profile block.
 * Frontend sends base fields plus exactly one of doctor or patient based on user.role.
 */
export class CreateProfileDto {
  @ValidateNested()
  @Validate(ProfileRoleConsistencyConstraint)
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
