import { UserRole } from '@repo/store';
import { Organization } from '@repo/store';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image: string;
  organization: string | null;
  phone: string;
  integrated_user_id: string | null;
}

export interface Session {
  user?: SessionUser | null;
  organization?: Organization | null;
}
