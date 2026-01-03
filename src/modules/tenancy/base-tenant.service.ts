import {
  Injectable,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Repository, DataSource, EntityTarget } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { CONNECTION } from './tenancy.symbols';
import { TenantAuthInitService } from './tenant-auth-init.service';

@Injectable()
export abstract class BaseTenantService {
  protected readonly logger: Logger;
  private static initializedTenants = new Set<string>();

  constructor(
    @Inject(REQUEST) protected readonly request: Request,
    @Inject(CONNECTION) protected readonly connection: DataSource | null,
    protected readonly tenantAuthInitService: TenantAuthInitService,
    serviceName: string,
  ) {
    this.logger = new Logger(serviceName);
  }

  protected getTenantSlug(): string {
    const tenantSlug = (this.request as any).tenantSlug;
    if (!tenantSlug) {
      throw new UnauthorizedException('Tenant slug is required');
    }
    return tenantSlug;
  }

  /**
   * Ensure auth tables exist for the current tenant
   */
  protected async ensureTablesExist(): Promise<void> {
    const tenantSlug = this.getTenantSlug();

    if (BaseTenantService.initializedTenants.has(tenantSlug)) {
      return;
    }

    try {
      await this.tenantAuthInitService.ensureTenantAuthTables(tenantSlug);
      BaseTenantService.initializedTenants.add(tenantSlug);
    } catch (error) {
      this.logger.error(
        `Failed to ensure tables for tenant ${tenantSlug}:`,
        error,
      );
    }
  }

  protected getRepository<T>(entity: EntityTarget<T>): Repository<T> {
    if (!this.connection) {
      throw new UnauthorizedException('Tenant connection not available');
    }
    return this.connection.getRepository(entity);
  }
}
