import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Tenant } from '../../public/tenants/entities/tenant.entity';
import { Session as PublicSession } from '../../public/auth/entities/session.entity';
import { ClientSessionCleanupService } from './client/client-session-cleanup.service';
import { ClientOtpCleanupService } from './client/client-otp-cleanup.service';
import { PublicSessionCleanupService } from './public/public-session-cleanup.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Tenant, PublicSession], 'default'),
  ],
  providers: [
    ClientSessionCleanupService,
    ClientOtpCleanupService,
    PublicSessionCleanupService,
  ],
})
export class CronModule {}
