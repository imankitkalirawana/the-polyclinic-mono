import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

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
}
