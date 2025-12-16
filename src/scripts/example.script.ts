// src/scripts/example.script.ts
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/public/users/users.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const usersService = app.get(UsersService);

    console.log('Starting backfill...');
    const users = await usersService.findAll({});
    console.log(users);
    console.log('Backfill completed');
  } catch (err) {
    console.error('Script failed:', err);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

run();
