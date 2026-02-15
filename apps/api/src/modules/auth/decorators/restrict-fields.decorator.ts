import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@repo/store';

export const RESTRICT_FIELDS_KEY = 'restrictFields';

export interface FieldRestriction {
  role: UserRole | UserRole[];
  fields: string[];
}

/**
 * Decorator to restrict certain fields from being updated by specific roles
 * @param restrictions Array of role-based field restrictions
 */
export const RestrictFields = (...restrictions: FieldRestriction[]) =>
  SetMetadata(RESTRICT_FIELDS_KEY, restrictions);
