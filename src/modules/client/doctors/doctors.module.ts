import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../../tenancy/tenancy.module';
import { Tenant } from '../../public/tenants/entities/tenant.entity';
import { TenantAuthInitService } from '../../tenancy/tenant-auth-init.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant], 'default'),
    AuthModule,
    TenancyModule,
  ],
  controllers: [DoctorsController],
  providers: [DoctorsService, TenantAuthInitService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
