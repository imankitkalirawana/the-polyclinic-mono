import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class TenantBearerAuthGuard extends AuthGuard('tenant-bearer') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
