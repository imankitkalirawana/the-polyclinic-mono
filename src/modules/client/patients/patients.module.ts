import { Module, forwardRef } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/auth/users/users.module';

@Module({
  imports: [forwardRef(() => AuthModule), UsersModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
