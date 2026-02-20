import 'dotenv/config';
import './constants/globals';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { AppModule } from './app.module';
import { CloudLoggerService } from './modules/common/logging/cloud-logger.service';
import { RequestContextInterceptor } from './common/request-context/request-context.interceptor';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use custom logger
  const logger = app.get(CloudLoggerService);
  logger.setContext('Bootstrap');
  app.useLogger(logger);
  app.setGlobalPrefix('api/v1');
  // Raw body parser for Razorpay webhook endpoint
  app.use(
    '/api/v1/payments/webhook',
    express.raw({ type: 'application/json' }),
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedRegex =
        /^https?:\/\/([a-z0-9-]+\.)?(localhost:3000|lvh\.me:3000|thepolyclinic\.app)(:\d+)?$/i;

      if (allowedRegex.test(origin)) {
        callback(null, origin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        // Recursively collect all constraint messages, including from nested children
        const extractMessages = (
          validationErrors: ValidationError[],
        ): string[] => {
          const messages: string[] = [];

          for (const error of validationErrors) {
            if (error.constraints) {
              const constraintValues = Object.values(
                error.constraints ?? {},
              ).filter((value): value is string => typeof value === 'string');

              messages.push(...constraintValues);
            }
            if (Array.isArray(error.children) && error.children.length) {
              messages.push(...extractMessages(error.children));
            }
          }

          return messages;
        };

        const messages = extractMessages(errors);

        return new BadRequestException({
          message: messages,
          error: 'Bad Request',
          statusCode: 400,
        });
      },
    }),
  );

  app.useGlobalInterceptors(new RequestContextInterceptor());

  app.enableShutdownHooks();

  const port = process.env.PORT ?? 8000;
  await app.listen(port, '0.0.0.0');

  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', error.stack, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('Unhandled Rejection', error.stack, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      promise: String(promise),
    });
  });
}
bootstrap();
