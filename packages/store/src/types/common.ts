export type Base = {
  id: string;
  createdBy: string;
  updatedBy: string;
  deletedBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
};
