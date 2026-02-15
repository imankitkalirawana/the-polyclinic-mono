import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UserTableViewColumnItemDto {
  @IsUUID('4')
  @IsNotEmpty()
  id: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  visible?: boolean;

  @IsNumber()
  @Min(1)
  @IsOptional()
  width?: number;

  @IsBoolean()
  @IsOptional()
  pinned?: boolean;
}

export class UpdateUserTableViewColumnsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserTableViewColumnItemDto)
  columns: UserTableViewColumnItemDto[];
}
