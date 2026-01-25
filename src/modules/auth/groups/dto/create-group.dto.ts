import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CompanyType } from '../../entities/company.entity';

export class CreateGroupDto {
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  unique_id: string;

  @IsString()
  @IsNotEmpty()
  schema: string;

  @IsEnum(CompanyType)
  company_type: CompanyType;

  @IsString()
  @IsOptional()
  time_zone?: string;

  @IsObject()
  @IsOptional()
  configuration?: Record<string, any>;
}
