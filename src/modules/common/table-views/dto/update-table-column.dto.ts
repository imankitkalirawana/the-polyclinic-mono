import { IsString, IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ColumnDataType } from '../entities/column.entity';

export class UpdateTableColumnDto {
  @IsString()
  @IsOptional()
  key: string;

  @IsString()
  @IsOptional()
  name: string;

  @IsEnum(ColumnDataType)
  @IsOptional()
  data_type: ColumnDataType;

  @IsBoolean()
  @IsOptional()
  is_sortable: boolean;
}
