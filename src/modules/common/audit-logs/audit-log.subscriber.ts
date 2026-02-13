import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  SoftRemoveEvent,
  RecoverEvent,
} from 'typeorm';
import {
  AuditLog,
  Event as AuditEvent,
  ItemType,
  ActorType,
} from './entities/audit-logs.entity';
import { User } from '@/auth/entities/user.entity';
import { Patient } from '@/common/patients/entities/patient.entity';
import { Doctor } from '@/common/doctors/entities/doctor.entity';
import { Company } from '@/auth/entities/company.entity';
import { RequestContext } from '../../../common/request-context/request-context';

type AnyEntity =
  | User
  | Patient
  | Doctor
  | Company
  | AuditLog
  | Record<string, unknown>;

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

    return null;
  }

  /**
   * Utility to build a simple before/after changes object for updates.
   */
  private buildUpdateChanges(event: UpdateEvent<AnyEntity>) {
    if (!event.entity || !event.databaseEntity) return null;

    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

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
    const object_changes =
      entity && typeof entity === 'object'
        ? { after: toPlainRecord(entity) }
        : null;

    const log = event.manager.create(AuditLog, {
      item_id: getEntityId(event.entity),
      item_type: itemType,
      event: AuditEvent.CREATE,
      ...meta,
      object_changes,
    });

    await event.manager.save(log);
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

    await event.manager.save(log);
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
        ? { before: toPlainRecord(dbEntity) }
        : null;

    const log = event.manager.create(AuditLog, {
      item_id: id,
      item_type: itemType,
      event: AuditEvent.DELETE,
      ...meta,
      object_changes,
    });

    await event.manager.save(log);
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
        ? { before: toPlainRecord(dbEntity) }
        : null;

    const log = event.manager.create(AuditLog, {
      item_id: id,
      item_type: itemType,
      event: AuditEvent.SOFT_DELETE,
      ...meta,
      object_changes,
    });

    await event.manager.save(log);
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
        ? { after: toPlainRecord(entity) }
        : null;

    const log = event.manager.create(AuditLog, {
      item_id: id,
      item_type: itemType,
      event: AuditEvent.RESTORE,
      ...meta,
      object_changes,
    });

    await event.manager.save(log);
  }
}
