import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';

export type CurrentUserPayload =
  | {
      userId: string;
      email: string;
      name: string;
      phone: string | null;
      role: Role;
      sessionId: string;
      type: 'global';
    }
  | {
      userId: string;
      email: string;
      name: string;
      phone: string | null;
      role: Role;
      sessionId: string;
      type: 'tenant';
      tenantSlug: string;
      groupId?: string;
      companyId?: string;
    };

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
