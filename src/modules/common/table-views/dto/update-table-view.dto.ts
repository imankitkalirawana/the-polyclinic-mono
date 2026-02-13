import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateUserTableViewDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  filters?: Record<string, unknown>;
}
