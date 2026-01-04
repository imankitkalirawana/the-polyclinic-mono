import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DataSource, Repository } from 'typeorm';
import { BaseTenantService } from '@/tenancy/base-tenant.service';
import { CONNECTION } from '@/tenancy/tenancy.symbols';
import { TenantAuthInitService } from '@/tenancy/tenant-auth-init.service';
import { ActivityLog } from '../entities/activity-log.entity';
import { getTenantConnection } from '@/tenancy/connection-pool';

@Injectable()
export class ActivityLogService extends BaseTenantService {
  constructor(
    @Inject(REQUEST) request: Request,
    @Inject(CONNECTION) connection: DataSource | null,
    tenantAuthInitService: TenantAuthInitService,
  ) {
    super(request, connection, tenantAuthInitService, ActivityLogService.name);
  }

  async getActivityLogsByEntity(entityType: string, entityId: string) {
    await this.ensureTablesExist();

    const tenantSlug = this.getTenantSlug();
    const connection = await getTenantConnection(tenantSlug);
    const repository: Repository<ActivityLog> =
      connection.getRepository(ActivityLog);

    const activityLogs = await repository.find({
      where: {
        entityType,
        entityId,
      },
      relations: ['actor'],
      order: {
        createdAt: 'DESC',
      },
    });

    return activityLogs.map((log) => ({
      id: log.id,
      entityType: log.entityType,
      entityId: log.entityId,
      module: log.module,
      action: log.action,
      changedFields: log.changedFields,
      previousData: log.previousData,
      newData: log.newData,
      description: log.description,
      createdAt: log.createdAt,
      actor: log.actor
        ? {
            id: log.actor.id,
            name: log.actor.name,
            email: log.actor.email,
            image: log.actor.image,
            role: log.actor.role,
            type: log.actorType,
          }
        : null,
    }));
  }
}
