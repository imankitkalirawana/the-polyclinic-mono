export enum ItemType {
  USER = "User",
  PATIENT = "Patient",
  DOCTOR = "Doctor",
  COMPANY = "Company",
  QUEUE = "Queue",
  PAYMENT = "Payment",
}

export enum Event {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  SOFT_DELETE = "SOFT_DELETE",
  RESTORE = "RESTORE",
}

export enum ActorType {
  USER = "USER",
  SYSTEM = "SYSTEM",
}

export type ObjectChanges = {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};
