import { Role } from '../enums/role.enum';

export type RedactFieldConfig = Partial<Record<Role, Array<Role>>>;

export const DEFAULT_REDACT_FIELD_CONFIG: RedactFieldConfig = {
  PATIENT: [Role.DOCTOR, Role.ADMIN, Role.RECEPTIONIST],
  DOCTOR: [Role.ADMIN],
  RECEPTIONIST: [Role.ADMIN],
};

export function redactField({
  value,
  currentRole,
  targetRole,
  config = DEFAULT_REDACT_FIELD_CONFIG,
}: {
  value: string | null | undefined;
  currentRole: Role;
  targetRole: Role;
  config?: RedactFieldConfig;
}) {
  if (!value) return null;

  const rolesToRedact = config?.[currentRole];
  if (rolesToRedact && rolesToRedact.includes(targetRole)) {
    return `${value.slice(0, 3)}*****${value.slice(-3)}`;
  }
  return value;
}
