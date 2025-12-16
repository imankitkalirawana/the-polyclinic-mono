import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { SystemRole } from '../../../../common/enums/role.enum';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsEnum(SystemRole)
  @IsOptional()
  role?: SystemRole;
}

