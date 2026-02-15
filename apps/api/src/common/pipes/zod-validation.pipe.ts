import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  static create<T>(schema: ZodSchema<T>): ZodValidationPipe<T> {
    return new ZodValidationPipe(schema);
  }

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);
    if (result.success) {
      return result.data;
    }
    const error = result.error as ZodError;
    const messages = error.issues.map((e) => {
      const path = Array.isArray(e.path) ? e.path.join('.') : String(e.path);
      return path ? `${path}: ${e.message}` : e.message;
    });
    throw new BadRequestException(messages);
  }
}
