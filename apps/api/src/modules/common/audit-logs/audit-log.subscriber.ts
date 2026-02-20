import {
  EntitySubscriberInterface,
  EntityManager,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  SoftRemoveEvent,
  RecoverEvent,
} from 'typeorm';
import {
  Event as AuditEvent,
  ItemType,
  ActorType,
  ObjectChanges,
} from '@repo/store';
import { User } from '@auth/entities/user.entity';
import { Patient } from '@common/patients/entities/patient.entity';
import { Doctor } from '@common/doctors/entities/doctor.entity';
import { Company } from '@auth/entities/company.entity';
import { Queue } from '@client/appointments/queue/entities/queue.entity';
import { Payment } from '@client/payments/entities/payment.entity';
import { Drug } from '@common/drugs/entities/drug.entity';
import { RequestContext } from 'src/common/request-context/request-context';
import { getTenantConnection } from 'src/common/db/tenant-connection';
import { AuditLog } from './entities/audit-logs.entity';

type AnyEntity =
  | User
  | Patient
  | Doctor
  | Company
  | Queue
  | Payment
  | Drug
  | Record<string, unknown>;

/** ItemTypes that live only in public schema; their audit logs must go to public.audit_logs. */
const PUBLIC_ITEM_TYPES: ItemType[] = [
  ItemType.USER,
  ItemType.COMPANY,
  ItemType.DRUG,
  ItemType.PATIENT,
  ItemType.DOCTOR,
];

function isPublicEntity(itemType: ItemType): boolean {
  return PUBLIC_ITEM_TYPES.includes(itemType);
}

function isActorType(value: string | null | undefined): value is ActorType {
  return value === ActorType.USER || value === ActorType.SYSTEM;
}

function getEntityId(entity: unknown): string | null {
  if (entity === null || typeof entity !== 'object') return null;
  const id = (entity as Record<string, unknown>).id;
  return typeof id === 'string' ? id : null;
}

function toPlainRecord(entity: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entity)) {
    out[key] = value;
  }
  return out;
}

function getProperty(obj: unknown, key: string): unknown {
  if (obj === null || typeof obj !== 'object') return undefined;
  return (obj as Record<string, unknown>)[key];
}

@EventSubscriber()
export class AuditLogSubscriber implements EntitySubscriberInterface<AnyEntity> {
  /**
   * Listen to all entities, we'll filter inside using getItemType.
   */
  listenTo() {
    return Object;
  }

  /**
   * Skip entities we don't want to audit and map others to ItemType.
   */
  private getItemType(entity: AnyEntity | undefined): ItemType | null {
    if (!entity) return null;

    // Never audit audit log rows themselves
    if (entity instanceof AuditLog) return null;

    if (entity instanceof User) return ItemType.USER;
    if (entity instanceof Patient) return ItemType.PATIENT;
    if (entity instanceof Doctor) return ItemType.DOCTOR;
    if (entity instanceof Company) return ItemType.COMPANY;
    if (entity instanceof Queue) return ItemType.QUEUE;
    if (entity instanceof Payment) return ItemType.PAYMENT;
    if (entity instanceof Drug) return ItemType.DRUG;

    return null;
  }

  /**
   * Saves the audit log to the correct schema: public entities (User, Company, Drug)
   * always go to public.audit_logs; tenant entities go to the current connection's schema.
   */
  private async saveAuditLog(
    manager: EntityManager,
    log: AuditLog,
    itemType: ItemType,
  ): Promise<void> {
    if (isPublicEntity(itemType)) {
      const publicConn = await getTenantConnection('public');
      await publicConn.getRepository(AuditLog).save(log);
    } else {
      await manager.save(log);
    }
  }

  /**
   * Utility to build a simple before/after changes object for updates.
   */
  private buildUpdateChanges(
    event: UpdateEvent<AnyEntity>,
  ): ObjectChanges | null {
    if (!event.entity || !event.databaseEntity) return null;

    const before: ObjectChanges['before'] = {};
    const after: ObjectChanges['after'] = {};

    for (const column of event.updatedColumns) {
      const propertyName = column.propertyName;
      const prev = getProperty(event.databaseEntity, propertyName);
      const next = getProperty(event.entity, propertyName);

      if (prev === next) continue;

      before[propertyName] = prev;
      after[propertyName] = next;
    }

    if (!Object.keys(before).length) {
      return null;
    }

    return { before, after };
  }

  /**
   * Common metadata derived from the current request context, if any.
   */
  private getContextMeta() {
    const ctx = RequestContext.get();
    return {
      actor_type: isActorType(ctx?.actorType)
        ? ctx.actorType
        : ActorType.SYSTEM,
      actor_id: ctx?.userId ?? null,
      ip: ctx?.ip ?? null,
      user_agent: ctx?.userAgent ?? null,
      request_id: ctx?.requestId ?? null,
      source: ctx?.source ?? null,
    };
  }

  async afterInsert(event: InsertEvent<AnyEntity>): Promise<void> {
    const itemType = this.getItemType(event.entity);
    if (!itemType) return;

    const meta = this.getContextMeta();
    const entity = event.entity;
    const object_changes: ObjectChanges | null =
      entity && typeof entity === 'object'
        ? { before: null, after: toPlainRecord(entity) }
        : null;

    const log = event.manager.create(AuditLog, {
      item_id: getEntityId(event.entity),
      item_type: itemType,
      event: AuditEvent.CREATE,
      ...meta,
      object_changes,
    });

    console.log('[afterInsert] log', log);

    await this.saveAuditLog(event.manager, log, itemType);
  }

  async afterUpdate(event: UpdateEvent<AnyEntity>): Promise<void> {
    const itemType = this.getItemType(event.entity);
    if (!itemType) return;

    const changes = this.buildUpdateChanges(event);
    if (!changes) return;

    const id =
      getEntityId(event.entity) ?? getEntityId(event.databaseEntity) ?? null;

    const meta = this.getContextMeta();

    const log = event.manager.create(AuditLog, {
      item_id: id,
      item_type: itemType,
      event: AuditEvent.UPDATE,
      ...meta,
      object_changes: changes,
    });

    await this.saveAuditLog(event.manager, log, itemType);
  }

  async afterRemove(event: RemoveEvent<AnyEntity>): Promise<void> {
    const itemType = this.getItemType(event.entity);
    if (!itemType) return;

    const id =
      getEntityId(event.entity) ?? getEntityId(event.databaseEntity) ?? null;

    const meta = this.getContextMeta();
    const dbEntity = event.databaseEntity;
    const object_changes =
      dbEntity && typeof dbEntity === 'object'
        ? { before: toPlainRecord(dbEntity), after: null }
        : null;

    const log = event.manager.create(AuditLog, {
      item_id: id,
      item_type: itemType,
      event: AuditEvent.DELETE,
      ...meta,
      object_changes,
    });

    await this.saveAuditLog(event.manager, log, itemType);
  }

  async afterSoftRemove(event: SoftRemoveEvent<AnyEntity>): Promise<void> {
    const itemType = this.getItemType(event.entity);
    if (!itemType) return;

    const id =
      getEntityId(event.entity) ?? getEntityId(event.databaseEntity) ?? null;

    const meta = this.getContextMeta();
    const dbEntity = event.databaseEntity;
    const object_changes =
      dbEntity && typeof dbEntity === 'object'
        ? { before: toPlainRecord(dbEntity), after: null }
        : null;

    const log = event.manager.create(AuditLog, {
      item_id: id,
      item_type: itemType,
      event: AuditEvent.SOFT_DELETE,
      ...meta,
      object_changes,
    });

    await this.saveAuditLog(event.manager, log, itemType);
  }

  async afterRecover(event: RecoverEvent<AnyEntity>): Promise<void> {
    const itemType = this.getItemType(event.entity);
    if (!itemType) return;

    const id =
      getEntityId(event.entity) ?? getEntityId(event.databaseEntity) ?? null;

    const meta = this.getContextMeta();
    const entity = event.entity;
    const object_changes =
      entity && typeof entity === 'object'
        ? { before: null, after: toPlainRecord(entity) }
        : null;

    const log = event.manager.create(AuditLog, {
      item_id: id,
      item_type: itemType,
      event: AuditEvent.RESTORE,
      ...meta,
      object_changes,
    });

    await this.saveAuditLog(event.manager, log, itemType);
  }
}
