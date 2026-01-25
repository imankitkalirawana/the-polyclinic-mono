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

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const password_digest = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      email: dto.email,
      name: dto.name,
      phone: dto.phone ?? null,
      password_digest,
      role: dto.role ?? Role.OPS,
      company_type: dto.company_type ?? CompanyType.THE_POLYCLINIC,
      time_zone: dto.time_zone ?? 'UTC',
      email_verified: false,
      deleted: false,
      permissions: {},
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

    if (dto.password) {
      user.password_digest = await bcrypt.hash(dto.password, 10);
    }
    if (dto.email) user.email = dto.email;
    if (dto.name) user.name = dto.name;
    if (dto.phone !== undefined) user.phone = dto.phone ?? null;
    if (dto.role) user.role = dto.role;
    if (dto.company_type) user.company_type = dto.company_type;
    if (dto.time_zone) user.time_zone = dto.time_zone;

    return await this.userRepository.save(user);
  }

  async softRemove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.deleted = true;
    await this.userRepository.save(user);
  }
}
