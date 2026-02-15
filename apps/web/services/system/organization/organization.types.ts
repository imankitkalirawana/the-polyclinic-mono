import { z } from 'zod';
import { createOrganizationSchema, updateOrganizationSchema } from './organization.validation';

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
