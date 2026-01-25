import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from 'src/common/enums/role.enum';
import { SchemaValidatorService } from './schema/schema-validator.service';
import { CompanyType } from './entities/company.entity';
import {
  assertRoleAllowedForCompanyType,
  CLIENT_ROLES,
} from './utils/company-role.util';

type GlobalToken = { token: string; expiresIn: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly schemaValidator: SchemaValidatorService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async login(dto: LoginDto): Promise<GlobalToken> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email, deleted: false },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, user.password_digest);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { token, expiresAt } = await this.createSessionAndToken({ user });

    return { token, expiresIn: this.formatExpiresIn(expiresAt) };
  }

  async register(
    dto: RegisterDto,
  ): Promise<
    { user: Pick<User, 'id' | 'email' | 'name' | 'role'> } & GlobalToken
  > {
    const email = dto.email.trim().toLowerCase();
    const schema = await this.schemaValidator.assertSchemaExists(dto.schema);

    const existing = await this.userRepository.findOne({
      where: { email },
    });
    if (existing) {
      if (existing.deleted) {
        throw new ConflictException('User account is deleted');
      }

      const ok = await bcrypt.compare(dto.password, existing.password_digest);
      if (!ok) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const currentCompanies = Array.isArray(existing.companies)
        ? existing.companies
        : [];
      const normalizedCompanies = currentCompanies
        .map((c) => String(c).trim().toLowerCase())
        .filter(Boolean);

      if (normalizedCompanies.includes(schema)) {
        throw new ConflictException('User already registered for this schema');
      }

      existing.companies = [...new Set([...normalizedCompanies, schema])];
      if (dto.phone) existing.phone = dto.phone.trim();
      if (dto.name) existing.name = dto.name.trim();

      const savedUser = await this.userRepository.save(existing);
      const { token, expiresAt } = await this.createSessionAndToken({
        user: savedUser,
      });

      return {
        user: {
          id: savedUser.id,
          email: savedUser.email,
          name: savedUser.name,
          role: savedUser.role,
        },
        token,
        expiresIn: this.formatExpiresIn(expiresAt),
      };
    }

    const password_digest = await bcrypt.hash(dto.password, 10);
    // Registration is for client users (patients) by default.
    const companyType = CompanyType.CLIENT;
    const role = Role.PATIENT;
    // Defensive: ensure rules stay consistent if enums change.
    assertRoleAllowedForCompanyType(role, companyType);
    if (!CLIENT_ROLES.has(role)) {
      throw new ConflictException('Registration role is not allowed');
    }

    const user = this.userRepository.create({
      email,
      name: dto.name.trim(),
      phone: dto.phone?.trim() || null,
      password_digest,
      role,
      company_type: companyType,
      email_verified: false,
      deleted: false,
      time_zone: 'UTC',
      permissions: {},
      companies: [schema],
    });

    const savedUser = await this.userRepository.save(user);

    const { token, expiresAt } = await this.createSessionAndToken({
      user: savedUser,
    });

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
      },
      token,
      expiresIn: this.formatExpiresIn(expiresAt),
    };
  }

  async logout(sessionId: string, currentUserId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });
    if (!session || session.user_id !== currentUserId) {
      throw new UnauthorizedException('Session not found');
    }

    session.logged_in = false;
    session.logged_out_at = new Date();
    await this.sessionRepository.save(session);
  }

  async getMe(
    userId: string,
  ): Promise<Pick<User, 'id' | 'email' | 'name' | 'role' | 'companies'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deleted: false },
      select: ['id', 'email', 'name', 'role', 'companies'],
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private async getUserOrThrow(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deleted: false },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private async createSessionAndToken(args: {
    user: User;
  }): Promise<{ token: string; expiresAt: Date }> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const basePayload: any = {
      sessionId: '',
      userId: args.user.id,
      email: args.user.email,
      role: (args.user.role ?? Role.OPS) as Role,
    };

    // Create session row first (digest computed after sign)
    const session: Session = this.sessionRepository.create({
      user_id: args.user.id,
      auth_token_digest: '',
      logged_in: true,
      logged_out_at: null,
      expires_at: expiresAt,
      ip: null,
      user_agent: null,
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
