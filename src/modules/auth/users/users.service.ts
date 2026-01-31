import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { getTenantConnection } from 'src/common/db/tenant-connection';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class UsersService {
  private readonly schema: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(REQUEST) private request: Request,
  ) {
    this.schema = this.request.schema;
  }

  private async getConnection() {
    return await getTenantConnection(this.schema);
  }

  private async getUserRepository() {
    const connection = await this.getConnection();
    return connection.getRepository(User);
  }

  async checkUserExistsByEmail(email: string) {
    const userRepository = await this.getUserRepository();
    const user = await userRepository.findOne({
      where: {
        email,
        companies: ArrayContains([this.schema]),
      },
    });
    return user;
  }

  async checkUserExistsByEmailAndFail(email: string) {
    const userRepository = await this.getUserRepository();
    const user = await userRepository.findOne({
      where: {
        email,
        companies: ArrayContains([this.schema]),
      },
    });
    if (!user) {
      throw new NotFoundException(
        'User not found with email: ' + email,
        'schema: ' + this.schema,
      );
    }
    return user;
  }

  // safely check if the email is not already taken in this company
  async checkEmailIsNotTaken(email: string) {
    const userRepository = await this.getUserRepository();
    const user = await userRepository.findOne({
      where: {
        email,
        companies: ArrayContains([this.schema]),
      },
    });
    if (user) {
      throw new ConflictException('Email already taken');
    }
    return true;
  }

  // find user by email in the shared users table (any company)
  private async findUserByEmailGlobally(email: string): Promise<User | null> {
    const userRepository = await this.getUserRepository();
    return userRepository.findOne({
      where: { email },
    });
  }

  async create(dto: CreateUserDto) {
    const userRepository = await this.getUserRepository();

    const existingUser = await this.findUserByEmailGlobally(dto.email);
    if (existingUser) {
      const alreadyInCompany = existingUser.companies?.includes(this.schema);
      if (alreadyInCompany) {
        throw new ConflictException('Email already taken');
      }
      // User exists but not in this company: add this company
      const companies = [...(existingUser.companies || []), this.schema];
      await userRepository.update(existingUser.id, { companies });
      await this.updatePassword(existingUser.id, dto.password);
      return userRepository.findOneOrFail({ where: { id: existingUser.id } });
    }

    dto.companies = [this.schema];
    const user = userRepository.create(dto);
    if (!user) {
      throw new NotFoundException('Could not create user');
    }
    const saved = await userRepository.save(user);
    await this.updatePassword(saved.id, dto.password);
    return saved;
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      where: {
        companies: ArrayContains([this.schema]),
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, companies: ArrayContains([this.schema]) },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findOneByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: {
        email,
        companies: ArrayContains([this.schema]),
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.checkUserExistsByEmailAndFail(dto.email);
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return await this.userRepository.save(user);
  }

  async updatePassword(id: string, password: string) {
    const userRepository = await this.getUserRepository();
    await userRepository.update(id, {
      password_digest: await bcrypt.hash(password, 10),
    });
  }
}
