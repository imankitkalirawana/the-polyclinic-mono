import { Role } from '@/services/common/user/user.constants';
import type { Organization } from '@/services/system/organization';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  image: string;
  organization: string | null;
  phone: string;
  integrated_user_id: string | null;
}

export interface Session {
  user?: SessionUser | null;
  organization?: Organization | null;
}
