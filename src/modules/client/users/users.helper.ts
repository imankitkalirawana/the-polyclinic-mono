import { Role } from 'src/scripts/types';
import { TenantUser } from './entities/tenant-user.entity';
import { redactField } from 'src/common/utils/redact.util';

export function formatUser(user: TenantUser, currentRole: Role) {
  return {
    id: user.id,
    name: user.name,
    email: redactField({
      value: user.email,
      currentRole,
      targetRole: currentRole,
    }),
    phone: redactField({
      value: user.phone,
      currentRole,
      targetRole: currentRole,
    }),
    image: user.image,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
