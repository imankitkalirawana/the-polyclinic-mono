import { IsNotEmpty, IsString } from 'class-validator';

export class CompleteQueueDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  prescription: string;
}
