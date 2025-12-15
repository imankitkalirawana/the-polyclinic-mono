import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type
interface TenantRequest extends Request {
  tenantId?: string;
}

@Injectable()
export class TenancyMiddleware implements NestMiddleware {
  use(req: TenantRequest, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      // Allow requests without tenant ID for public routes (like creating tenants)
      // You might want to make this stricter based on your route structure
      return next();
    }

    if (typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new BadRequestException('Invalid tenant ID');
    }

    req.tenantId = tenantId.trim();
    next();
  }
}
