import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { getTenantConnection } from 'src/common/db/tenant-connection';
import { Request } from 'express';

@Injectable()
export class ColumnService {
  private readonly schema: string;

  constructor(@Inject(REQUEST) private request: Request) {
    this.schema = this.request.schema;
  }

  private async getConnection() {
    return await getTenantConnection(this.schema);
  }
}
