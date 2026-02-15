import { z } from 'zod';
import { createDepartmentSchema, updateDepartmentSchema } from './department.validation';
import type { Department } from '@repo/store';

export type { Department } from '@repo/store';

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export type DepartmentWithTeam = Department;
