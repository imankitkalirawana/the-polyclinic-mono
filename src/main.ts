import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { TenancyMiddleware } from './modules/tenancy/tenancy.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(new TenancyMiddleware().use.bind(new TenancyMiddleware()));
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
      exceptionFactory: (errors) => {
        const messages = errors
          .map((error) => {
            const firstConstraint = Object.values(error.constraints || {})[0];
            return firstConstraint;
          })
          .filter(Boolean); // Remove any undefined values

        return new BadRequestException({
          message: messages,
          error: 'Bad Request',
          statusCode: 400,
        });
      },
    }),
  );
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
