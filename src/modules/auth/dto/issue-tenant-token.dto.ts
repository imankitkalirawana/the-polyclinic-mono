import { IsNotEmpty, IsUUID } from 'class-validator';

export class IssueTenantTokenDto {
  @IsUUID()
  @IsNotEmpty()
  group_id: string;
}
