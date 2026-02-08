import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ColumnDataType } from '../entities/column.entity';

export class CreateTableColumnDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ColumnDataType)
  @IsNotEmpty()
  data_type: ColumnDataType;

  @IsBoolean()
  @IsOptional()
  is_sortable: boolean;
}
