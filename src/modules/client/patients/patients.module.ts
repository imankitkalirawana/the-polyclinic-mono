import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
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
  controllers: [PatientsController],
  providers: [PatientsService, TenantAuthInitService],
  exports: [PatientsService],
})
export class PatientsModule {}
