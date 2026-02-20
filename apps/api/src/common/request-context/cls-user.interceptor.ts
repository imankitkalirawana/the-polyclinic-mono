import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';
import { RequestWithUser } from './request-context.types';
import { REQUEST_USER_KEY } from './request-context.constants';

/**
 * Sets the authenticated user (req.user) into CLS so request-scoped services
 * can read it via ClsService without injecting REQUEST.
 */
@Injectable()
export class ClsUserInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const user = req.user;
    this.cls.set<Express.User>(REQUEST_USER_KEY, user ?? undefined);
    return next.handle();
  }
}
