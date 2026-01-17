import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsObject,
  ValidateIf,
  IsArray,
} from 'class-validator';
import { ActivityAction } from '../enums/activity-action.enum';
import { ActorType } from '../enums/actor-type.enum';

export class CreateActivityDto {
  @IsString()
  entityType: string;

  @IsUUID()
  entityId: string;

  @IsString()
  module: string;

  @IsEnum(ActivityAction)
  action: ActivityAction;

  @IsOptional()
  @IsObject()
  changedFields?: Record<string, any>;

  @IsOptional()
  @IsObject()
  previousData?: Record<string, any>;

  @IsOptional()
  @IsObject()
  newData?: Record<string, any>;

  @IsEnum(ActorType)
  actorType: ActorType;

  @ValidateIf((o) => o.actorType === ActorType.USER)
  @IsOptional()
  @IsUUID()
  actorId?: string | null;

  @IsOptional()
  @IsString()
  actorRole?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  stakeholders?: string[] | null;
}

