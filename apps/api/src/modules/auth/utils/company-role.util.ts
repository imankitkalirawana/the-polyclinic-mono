import { BadRequestException } from '@nestjs/common';
import { UserRole } from '@repo/store';
import { CompanyType } from '../entities/company.entity';

export const INTERNAL_ROLES: ReadonlySet<UserRole> = new Set<UserRole>([
  UserRole.SUPER_ADMIN,
  UserRole.MODERATOR,
  UserRole.OPS,
]);

export const CLIENT_ROLES: ReadonlySet<UserRole> = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.PATIENT,
  UserRole.DOCTOR,
  UserRole.NURSE,
  UserRole.RECEPTIONIST,
]);

export function assertRoleAllowedForCompanyType(
  role: UserRole,
  companyType: CompanyType,
): void {
  const allowed =
    companyType === CompanyType.THE_POLYCLINIC
      ? INTERNAL_ROLES.has(role)
      : CLIENT_ROLES.has(role);

  if (!allowed) {
    throw new BadRequestException(
      `Role ${role} is not allowed for company type ${companyType}`,
    );
  }
}

export function inferCompanyTypeForRole(role: UserRole): CompanyType {
  if (INTERNAL_ROLES.has(role)) return CompanyType.THE_POLYCLINIC;
  return CompanyType.CLIENT;
}

export function defaultRoleForCompanyType(companyType: CompanyType): UserRole {
  return companyType === CompanyType.THE_POLYCLINIC
    ? UserRole.OPS
    : UserRole.PATIENT;
}
