import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BearerStrategy } from './strategies/bearer.strategy';
import { PublicUser } from './entities/public-user.entity';
import { Session } from './entities/session.entity';
import { Otp } from './entities/otp.entity';
import { RolesGuard } from './guards/roles.guard';
import { FieldRestrictionsGuard } from './guards/field-restrictions.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([PublicUser, Session, Otp], 'default'),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, BearerStrategy, RolesGuard, FieldRestrictionsGuard],
  exports: [AuthService, BearerStrategy, RolesGuard, FieldRestrictionsGuard],
})
export class AuthModule {}
