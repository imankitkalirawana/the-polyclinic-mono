import { UserRole } from '@repo/store';

export type RedactFieldConfig = Partial<Record<UserRole, Array<UserRole>>>;

export const DEFAULT_REDACT_FIELD_CONFIG: RedactFieldConfig = {
  PATIENT: [UserRole.DOCTOR, UserRole.ADMIN, UserRole.RECEPTIONIST],
  DOCTOR: [UserRole.ADMIN],
  RECEPTIONIST: [UserRole.ADMIN],
};

export function redactField({
  value,
  currentRole,
  targetRole,
  config = DEFAULT_REDACT_FIELD_CONFIG,
}: {
  value: string | null | undefined;
  currentRole: UserRole;
  targetRole: UserRole;
  config?: RedactFieldConfig;
}) {
  if (!value) return null;

  const rolesToRedact = config?.[currentRole];
  if (rolesToRedact && rolesToRedact.includes(targetRole)) {
    return `${value.slice(0, 3)}*****${value.slice(-3)}`;
  }
  return value;
}
