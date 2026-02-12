import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';
import { UserTableViewColumn } from '../entities/table-view-column.entity';

export class UpdateUserTableViewDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  filters?: Record<string, unknown>;

  //   update columns
  @IsArray()
  @IsOptional()
  columns?: UserTableViewColumn[];
}
