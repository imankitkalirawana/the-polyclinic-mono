import { Global, Module } from '@nestjs/common';
import { Request } from 'express';
import { ClsModule } from 'nestjs-cls';

import { SchemaHandler } from './schema.service';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req: Request) => {
          const schema = req.headers['Schema'];

          cls.set(SCHEMA_KEY, schema);
        },
      },
    }),
  ],
  providers: [SchemaHandler],
  exports: [ClsModule, SchemaHandler],
})
export class SchemaModule {}
