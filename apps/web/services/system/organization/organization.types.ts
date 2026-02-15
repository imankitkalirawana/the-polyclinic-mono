import { z } from 'zod';
import { createOrganizationSchema, updateOrganizationSchema } from './organization.validation';
import type { Organization, OrganizationStatus } from '@repo/store';

export type { Organization, OrganizationStatus } from '@repo/store';

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
