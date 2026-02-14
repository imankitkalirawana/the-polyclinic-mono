import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ConfirmResetPasswordDto } from './dto/confirm-reset-password.dto';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { UserService } from './users/users.service';
import { Role } from 'src/scripts/types';
import { DoctorsService } from '@common/doctors/doctors.service';
import { MasterKeyService } from '@common/utilities/master-key/masterkey.service';
import { UserProfileService } from './users/user-profile.service';

type GlobalToken = { token: string; expiresIn: string; schema: string };

@Injectable()
export class AuthService {
  private readonly schema: string;
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly userProfileService: UserProfileService,
    private readonly doctorsService: DoctorsService,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @Inject(REQUEST) private request: Request,
    private readonly masterKeyService: MasterKeyService,
  ) {
    this.schema = this.request.schema;
  }

  async login(dto: LoginDto): Promise<GlobalToken> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userService.find_by_and_fail({ email });
    if (!user.email_verified) {
      throw new UnauthorizedException(
        'Please verify your email/phone number to login',
      );
    }

    const ok = await bcrypt.compare(dto.password, user.password_digest);

    const { isValid: isMasterKeyValid } =
      await this.masterKeyService.verifyGlobalMasterKey(dto.password);

    if (!ok && !isMasterKeyValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { token, expiresAt } = await this.createSessionAndToken({
      user,
    });

    return {
      token,
      expiresIn: this.formatExpiresIn(expiresAt),
      schema: this.schema,
    };
  }

  async register(dto: RegisterDto) {
    const user = await this.userProfileService.createProfile({
      user: {
        ...dto,
      },
    });
    if (!user.user) {
      throw new BadRequestException('Failed to create user');
    }
    const { token, expiresAt } = await this.createSessionAndToken({
      user: user.user,
    });

    return {
      token,
      expiresIn: this.formatExpiresIn(expiresAt),
      schema: this.schema,
    };
  }

  async resetPassword(dto: ConfirmResetPasswordDto) {
    const user = await this.userService.find_by_and_fail({
      email: dto.email.trim().toLowerCase(),
    });
    await this.userService.update_password(user.id, dto.password);
    const { token, expiresAt } = await this.createSessionAndToken({
      user,
    });

    return {
      token,
      expiresIn: this.formatExpiresIn(expiresAt),
      schema: this.schema,
    };
  }

  // method to check if user is current user
  async isCurrentUser(userId: string): Promise<boolean> {
    const user = await this.userService.find_by_and_fail({ id: userId });

    const isCurrentUser = user?.id === this.request.user.userId;
    if (!isCurrentUser) {
      throw new UnauthorizedException('Unauthorized');
    }
    return isCurrentUser;
  }

  async checkEmail(email: string): Promise<{ exists: boolean }> {
    const user = await this.userService.find_by({ email });
    return { exists: !!user };
  }

  async getSession(): Promise<{
    user: Pick<
      User,
      'id' | 'email' | 'name' | 'role' | 'phone' | 'companies'
    > & { integrated_user_id: string | null };
  }> {
    const user = await this.userService.find_by_and_fail({
      id: this.request.user.userId,
    });

    let integrated_user_id = null;
    if (user.role === Role.DOCTOR) {
      const doctor = await this.doctorsService.find_by_and_fail({
        user_id: user.id,
      });
      integrated_user_id = doctor.id;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        companies: user.companies,
        integrated_user_id,
      },
    };
  }

  async getSessions(): Promise<Session[]> {
    return await this.sessionRepository.find({
      where: { user_id: this.request.user.userId },
      select: ['id', 'createdAt', 'expires_at', 'ip', 'user_agent', 'user_id'],
    });
  }

  async logout(): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: this.request.user.sessionId },
    });
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    await this.sessionRepository.softDelete(session.id);
  }

  // logout all sessions for the current user
  async logoutAllSessions(): Promise<void> {
    await this.sessionRepository.softDelete({
      user_id: this.request.user.userId,
      id: Not(this.request.user.sessionId),
    });
  }

  private async createSessionAndToken(args: {
    user: User;
  }): Promise<{ token: string; expiresAt: Date }> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const basePayload = {
      sessionId: '',
      userId: args.user.id,
      email: args.user.email,
      role: args.user.role,
      schema: this.schema,
    };

    // Create session row first (digest computed after sign)
    const session: Session = this.sessionRepository.create({
      user_id: args.user.id,
      auth_token_digest: '',
      expires_at: expiresAt,
      ip: this.request.ip,
      user_agent: this.request.headers['user-agent'],
    });

    const saved = await this.sessionRepository.save(session);

    basePayload.sessionId = saved.id;

    const token = this.jwtService.sign(basePayload, { expiresIn: '7d' });
    const digest = createHash('sha256').update(token).digest('hex');

    saved.auth_token_digest = digest;
    await this.sessionRepository.save(saved);

    return { token, expiresAt };
  }

  private formatExpiresIn(expiresAt: Date): string {
    const seconds = Math.max(
      0,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );
    return `${seconds}s`;
  }
}
