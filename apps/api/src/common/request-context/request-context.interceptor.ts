import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContext } from './request-context';
import { RequestWithUser, singleHeader } from './request-context.types';
import { ActorType } from '@repo/store';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithUser>();
    const user = req.user;

    const path = req.path?.trim();
    const raw =
      path && path.length > 0 ? `${req.method} ${path}` : (req.method ?? 'api');
    const source = raw.length > 50 ? raw.slice(0, 50) : raw;

    const requestId = singleHeader(req.headers['x-request-id']);
    const userAgent = singleHeader(req.headers['user-agent']);

    const data = {
      userId: user?.userId ?? null,
      actorType: user ? ActorType.USER : ActorType.SYSTEM,
      ip: req.ip ?? null,
      userAgent,
      requestId,
      source,
    };

    return RequestContext.run(data, () => next.handle());
  }
}
