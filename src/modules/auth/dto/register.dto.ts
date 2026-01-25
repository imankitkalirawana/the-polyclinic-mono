import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Tenant schema slug to add to this user (normalized lowercase).
   * Example: "demo"
   */
  @IsString()
  @IsNotEmpty()
  schema: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
