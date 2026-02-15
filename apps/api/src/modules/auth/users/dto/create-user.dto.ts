import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from '@repo/store';
import { CompanyType } from '../../entities/company.entity';
import { AuthSource } from '../../entities/user.entity';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.PATIENT;

  @IsEnum(CompanyType)
  @IsOptional()
  company_type?: CompanyType;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  time_zone?: string;

  @IsEnum(AuthSource)
  @IsOptional()
  auth_source?: AuthSource;

  /**
   * Optional list of tenant schema slugs this user can access.
   * Values are normalized/validated server-side.
   */
  @IsArray()
  @IsOptional()
  companies?: string[];
}
