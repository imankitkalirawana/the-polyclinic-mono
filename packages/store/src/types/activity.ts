export type ActivitySchema = "appointment" | "user" | "drug" | "service";

export enum ActivityStatus {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
}

export enum ActivityAction {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  STATUS_CHANGED = "STATUS_CHANGED",
  DELETED = "DELETED",
  SOFT_DELETED = "SOFT_DELETED",
}

export enum ActorType {
  USER = "USER",
  SYSTEM = "SYSTEM",
}

export type ChangedField = {
  before: string | number | boolean | null | undefined;
  after: string | number | boolean | null | undefined;
};

export type Actor = {
  id: string;
  name: string;
  email: string;
  image: string;
  type: ActorType;
};

export type ActivityLog = {
  _id: string;
  id: number;
  title: string;
  schema: ActivitySchema;
  description?: string;
  by?: {
    uid: string;
    name: string;
    email: string;
    image: string;
  };
  status?: ActivityStatus;
  metadata?: {
    fields?: string[];
    diff?: Record<string, { old: unknown; new: unknown }>;
  };
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type ActivityLogResponse = {
  id: string;
  entityType: string;
  entityId: string;
  module: string;
  action: ActivityAction;
  changedFields: Record<string, ChangedField> | null;
  previousData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  description: string | null;
  createdAt: string;
  actor: Actor;
};
