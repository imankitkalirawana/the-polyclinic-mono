/// <reference types="express" />

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      name: string;
      phone: string;
      role: Role;
      sessionId: string;
      type: 'tenant';
      tenantSlug: string;
    }

    interface Request {
      tenantSlug?: string;
    }
  }
}

export {};
