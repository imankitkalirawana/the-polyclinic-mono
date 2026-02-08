import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { QueueStatus } from '../entities/queue.entity';

/**
 * Query params for GET /client/appointments/queue.
 * - date_gte / date_lte: inclusive range (appointmentDate >= date_gte, <= date_lte).
 *
 */

export class AppointmentDateRange {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (value) {
      return new Date(value).toISOString();
    }
    return undefined;
  })
  start?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (value) {
      return new Date(value).toISOString();
    }
    return undefined;
  })
  end?: string;
}
export class FindAllQueueQueryDto {
  @ValidateNested()
  @Type(() => AppointmentDateRange)
  @IsOptional()
  date?: AppointmentDateRange;

  // status
  @IsEnum(QueueStatus, {
    each: true,
  })
  @IsOptional()
  status?: QueueStatus[];
}
