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
      integrated_user_id: string | null;
    }

    interface Request {
      schema?: string | null | undefined;
    }
  }
}

export {};
