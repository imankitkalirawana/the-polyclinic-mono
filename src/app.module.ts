import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationModule } from './organization/organization.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, OrganizationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
