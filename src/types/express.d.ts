/// <reference types="express" />

import { Role } from '../common/enums/role.enum';

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      name: string;
      phone: string | null;
      role: Role;
      sessionId: string;
      type: 'global' | 'tenant';
      /**
       * Present only when `type === 'tenant'`.
       */
      tenantSlug?: string;
      groupId?: string;
      companyId?: string;
    }

    interface Request {
      tenantSlug?: string;
    }
  }
}

export {};
