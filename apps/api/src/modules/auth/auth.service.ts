import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import {
  LoginDto,
  GoogleAuthDto,
  ConfirmResetPasswordDto,
  AuthSource,
  UserRole,
  RegisterDto,
} from '@repo/store';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { UserService } from './users/users.service';
import { DoctorsService } from '@common/doctors/doctors.service';
import { MasterKeyService } from '@common/utilities/master-key/masterkey.service';
import { UserProfileService } from './users/user-profile.service';
import { PatientsService } from '@common/patients/patients.service';

type GlobalToken = { token: string; expiresIn: string; schema: string };

@Injectable()
export class AuthService {
  private readonly schema: string;
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly userProfileService: UserProfileService,
    private readonly doctorsService: DoctorsService,
    private readonly patientsService: PatientsService,
    private readonly configService: ConfigService,
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
        role: UserRole.PATIENT,
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
      email: dto.email,
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

  async googleLogin(dto: GoogleAuthDto): Promise<GlobalToken> {
    const { email, name } = await this.getGoogleUserInfo(dto.credential);
    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    let user = await this.userService.find_by({ email }, { globally: true });

    if (!user) {
      const newUser = await this.userProfileService.createProfile({
        user: {
          email,
          name,
          role: UserRole.PATIENT,
          auth_source: AuthSource.GOOGLE,
        },
        patient: {},
        email_verified: true,
      });
      user = newUser.user;
    } else {
      if (!user.companies?.includes(this.schema)) {
        await this.userService.add_user_to_company(email, this.schema);
        if (user.deletedAt) {
          await this.userService.restore(user.id);
        }
      }
      user = await this.userService.find_by_and_fail({ email });
    }

    const { token, expiresAt } = await this.createSessionAndToken({ user });

    return {
      token,
      expiresIn: this.formatExpiresIn(expiresAt),
      schema: this.schema,
    };
  }

  /**
   * Resolves Google user email and name from either an ID token (JWT) or an OAuth2 access token.
   */
  private async getGoogleUserInfo(
    credential: string,
  ): Promise<{ email: string; name: string }> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const isJwt =
      credential.split('.').length === 3 &&
      !credential.startsWith('ya29.') &&
      !credential.startsWith('1/');

    if (isJwt && clientId) {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload?.email) {
        throw new UnauthorizedException('Invalid Google credential');
      }
      return {
        email: payload.email,
        name: payload.name ?? payload.email.split('@')[0],
      };
    }

    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${credential}` },
    });
    if (!res.ok) {
      throw new UnauthorizedException('Invalid or expired Google credential');
    }
    const data = (await res.json()) as {
      email?: string;
      name?: string;
    };
    if (!data?.email) {
      throw new UnauthorizedException('Google account has no email');
    }
    return {
      email: data.email,
      name: data.name,
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
      'id' | 'email' | 'name' | 'role' | 'phone' | 'companies' | 'auth_source'
    > & { integrated_user_id: string | null };
  }> {
    const user = await this.userService.find_by_and_fail({
      id: this.request.user.userId,
    });

    let integrated_user_id = null;
    if (user.role === UserRole.DOCTOR) {
      const doctor = await this.doctorsService.find_by_and_fail({
        user_id: user.id,
      });
      integrated_user_id = doctor.id;
    }
    if (user.role === UserRole.PATIENT) {
      const patient = await this.patientsService.find_by_and_fail({
        user_id: user.id,
      });
      integrated_user_id = patient.id;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        companies: user.companies,
        auth_source: user.auth_source,
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
