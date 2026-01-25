import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { Group } from './entities/group.entity';
import { UserGroup } from './entities/user-group.entity';
import { Company } from './entities/company.entity';
import { UsersModule } from './users/users.module';
import { CompanyModule } from './companies/company.module';
import { GroupModule } from './groups/group.module';
import { SchemaValidatorService } from './schema/schema-validator.service';
import { GlobalBearerStrategy } from './strategies/global-bearer.strategy';
import { TenantBearerStrategy } from './strategies/tenant-bearer.strategy';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session, Group, UserGroup, Company]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    UsersModule,
    CompanyModule,
    GroupModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SchemaValidatorService,
    GlobalBearerStrategy,
    TenantBearerStrategy,
    RolesGuard,
  ],
  exports: [
    AuthService,
    SchemaValidatorService,
    GlobalBearerStrategy,
    TenantBearerStrategy,
    RolesGuard,
  ],
})
export class AuthModule {}
