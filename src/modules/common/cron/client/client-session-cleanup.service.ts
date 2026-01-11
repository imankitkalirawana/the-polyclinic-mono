import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTenantConnectionConfig } from '../../../../tenant-orm.config';
import { Session } from '../../../client/auth/entities/session.entity';
import { Tenant } from '../../../public/tenants/entities/tenant.entity';

@Injectable()
export class ClientSessionCleanupService {
  private readonly logger = new Logger(ClientSessionCleanupService.name);

  constructor(
    @InjectRepository(Tenant, 'default')
    private tenantRepository: Repository<Tenant>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron() {
    await this.cleanupAllTenantSessions();
  }

  async cleanupAllTenantSessions(): Promise<void> {
    const tenants = await this.tenantRepository.find();

    for (const tenant of tenants) {
      try {
        const config = getTenantConnectionConfig(tenant.slug);
        const connection = new DataSource(config);

        if (!connection.isInitialized) {
          await connection.initialize();
        }

        const sessionRepository = connection.getRepository(Session);
        const result = await sessionRepository
          .createQueryBuilder()
          .delete()
          .from(Session)
          .where('expiresAt < :now', { now: new Date() })
          .execute();

        this.logger.log(
          `Cleaned up ${result.affected || 0} expired sessions for tenant ${tenant.slug}`,
        );

        if (connection.isInitialized) {
          await connection.destroy();
        }
      } catch (error) {
        this.logger.error(
          `Error cleaning up sessions for tenant ${tenant.slug}:`,
          error,
        );
      }
    }
  }
}
