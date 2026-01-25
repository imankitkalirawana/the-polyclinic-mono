import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CompanyType } from '../entities/company.entity';
import { Role } from 'src/common/enums/role.enum';
import {
  assertRoleAllowedForCompanyType,
  defaultRoleForCompanyType,
  inferCompanyTypeForRole,
} from '../utils/company-role.util';
import { SchemaValidatorService } from '../schema/schema-validator.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly schemaValidator: SchemaValidatorService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const company_type =
      dto.company_type ??
      (dto.role
        ? inferCompanyTypeForRole(dto.role)
        : CompanyType.THE_POLYCLINIC);
    const role = dto.role ?? defaultRoleForCompanyType(company_type);
    assertRoleAllowedForCompanyType(role, company_type);

    const companies = await this.normalizeCompanies(dto.companies ?? []);

    const password_digest = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      email: dto.email.trim().toLowerCase(),
      name: dto.name,
      phone: dto.phone ?? null,
      password_digest,
      role,
      company_type,
      time_zone: dto.time_zone ?? 'UTC',
      email_verified: false,
      deleted: false,
      permissions: {},
      companies,
    });

    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({ where: { deleted: false } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, deleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    const nextCompanyType = dto.company_type ?? user.company_type;
    const nextRole = dto.role ?? user.role;
    assertRoleAllowedForCompanyType(
      nextRole as Role,
      nextCompanyType as CompanyType,
    );

    if (dto.password) {
      user.password_digest = await bcrypt.hash(dto.password, 10);
    }
    if (dto.email) user.email = dto.email;
    if (dto.name) user.name = dto.name;
    if (dto.phone !== undefined) user.phone = dto.phone ?? null;
    if (dto.role) user.role = dto.role;
    if (dto.company_type) user.company_type = dto.company_type;
    if (dto.time_zone) user.time_zone = dto.time_zone;
    if (dto.companies) {
      user.companies = await this.normalizeCompanies(dto.companies);
    }

    return await this.userRepository.save(user);
  }

  async softRemove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.deleted = true;
    await this.userRepository.save(user);
  }

  private async normalizeCompanies(values: string[]): Promise<string[]> {
    const normalized = values
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);

    const unique = [...new Set(normalized)];
    for (const schema of unique) {
      // validate format and existence (production-safe)
      await this.schemaValidator.assertSchemaExists(schema);
    }
    return unique;
  }
}
