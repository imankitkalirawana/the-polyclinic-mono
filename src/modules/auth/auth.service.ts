import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { Group } from './entities/group.entity';
import { UserGroup } from './entities/user-group.entity';
import { LoginDto } from './dto/login.dto';
import { IssueTenantTokenDto } from './dto/issue-tenant-token.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from 'src/common/enums/role.enum';
import { SchemaValidatorService } from './schema/schema-validator.service';
import { CompanyType } from './entities/company.entity';

type GlobalToken = { token: string; expiresIn: string };
type TenantToken = { token: string; expiresIn: string; tenantSlug: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly schemaValidator: SchemaValidatorService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(UserGroup)
    private readonly userGroupRepository: Repository<UserGroup>,
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

    const { token, expiresAt } = await this.createSessionAndToken({
      user,
      type: 'global',
    });

    return { token, expiresIn: this.formatExpiresIn(expiresAt) };
  }

  async register(
    dto: RegisterDto,
  ): Promise<
    { user: Pick<User, 'id' | 'email' | 'name' | 'role'> } & GlobalToken
  > {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const password_digest = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      email,
      name: dto.name.trim(),
      phone: dto.phone?.trim() || null,
      password_digest,
      role: Role.PATIENT,
      company_type: CompanyType.THE_POLYCLINIC,
      email_verified: false,
      deleted: false,
      time_zone: 'UTC',
      permissions: {},
    });

    const savedUser = await this.userRepository.save(user);

    const { token, expiresAt } = await this.createSessionAndToken({
      user: savedUser,
      type: 'global',
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

  async issueTenantToken(
    currentUserId: string,
    dto: IssueTenantTokenDto,
  ): Promise<TenantToken> {
    const group = await this.groupRepository.findOne({
      where: { id: dto.group_id, deleted: false },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = await this.userGroupRepository.findOne({
      where: { user_id: currentUserId, group_id: group.id, deleted: false },
    });
    if (!membership) {
      throw new UnauthorizedException('User not assigned to this group');
    }

    const tenantSlug = await this.schemaValidator.assertAllowedTenantSchema(
      group.schema,
    );

    const { token, expiresAt } = await this.createSessionAndToken({
      user: await this.getUserOrThrow(currentUserId),
      type: 'tenant',
      tenantSlug,
      groupId: group.id,
      companyId: group.company_id,
    });

    return { token, expiresIn: this.formatExpiresIn(expiresAt), tenantSlug };
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
  ): Promise<Pick<User, 'id' | 'email' | 'name' | 'role'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deleted: false },
      select: ['id', 'email', 'name', 'role'],
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
    type: 'global' | 'tenant';
    tenantSlug?: string;
    groupId?: string;
    companyId?: string;
  }): Promise<{ token: string; expiresAt: Date }> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const basePayload: any = {
      sessionId: '',
      userId: args.user.id,
      email: args.user.email,
      role: (args.user.role ?? Role.OPS) as Role,
      type: args.type,
    };

    if (args.type === 'tenant') {
      if (!args.tenantSlug) {
        throw new ConflictException('Missing tenant schema');
      }
      basePayload.tenantSlug = args.tenantSlug;
      if (args.groupId) basePayload.groupId = args.groupId;
      if (args.companyId) basePayload.companyId = args.companyId;
    }

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
