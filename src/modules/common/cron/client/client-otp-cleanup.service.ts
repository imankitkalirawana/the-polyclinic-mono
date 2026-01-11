import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTenantConnectionConfig } from '../../../../tenant-orm.config';
import { Otp } from '../../../client/auth/entities/otp.entity';
import { Tenant } from '../../../public/tenants/entities/tenant.entity';

@Injectable()
export class ClientOtpCleanupService {
  private readonly logger = new Logger(ClientOtpCleanupService.name);

  constructor(
    @InjectRepository(Tenant, 'default')
    private tenantRepository: Repository<Tenant>,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    this.logger.debug('Cleaning up expired OTPs');
    await this.cleanupAllTenantOtps();
  }

  async cleanupAllTenantOtps(): Promise<void> {
    const tenants = await this.tenantRepository.find();

    for (const tenant of tenants) {
      try {
        const config = getTenantConnectionConfig(tenant.slug);
        const connection = new DataSource(config);

        if (!connection.isInitialized) {
          await connection.initialize();
        }

        const otpRepository = connection.getRepository(Otp);
        const result = await otpRepository
          .createQueryBuilder()
          .delete()
          .from(Otp)
          .where('expiresAt < :now', { now: new Date() })
          .execute();

        this.logger.log(
          `Cleaned up ${result.affected || 0} expired OTPs for tenant ${tenant.slug}`,
        );

        if (connection.isInitialized) {
          await connection.destroy();
        }
      } catch (error) {
        this.logger.error(
          `Error cleaning up OTPs for tenant ${tenant.slug}:`,
          error,
        );
      }
    }
  }
}
