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
import { CreateUserDto } from '@/auth/users/dto/create-user.dto';

import { getTenantConnection } from 'src/common/db/tenant-connection';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { UserFindOptions } from './users.types';

@Injectable()
export class UserService {
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

  /**
   * Generic single user finder that allows calls like:
   * `userService.find_by({ email: 'test@example.com' })`
   *
   * Always scopes the query to the current company (`schema`) by
   * enforcing `companies` to contain the active schema.
   */
  async find_by(
    where: Partial<User>,
    options?: UserFindOptions,
  ): Promise<User | null> {
    const userRepository = await this.getUserRepository();
    return userRepository.findOne({
      where: {
        ...where,
        ...(!options?.globally && { companies: ArrayContains([this.schema]) }),
      },
    });
  }

  // find_by_and_fail
  async find_by_and_fail(
    where: Partial<User>,
    options?: UserFindOptions,
  ): Promise<User> {
    const user = await this.find_by(where, options);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Generic multiple users finder that allows calls like:
   * `userService.find_all({ email: 'test@example.com' })`
   *
   * Always scopes the query to the current company (`schema`) by
   * enforcing `companies` to contain the active schema.
   */
  async find_all(
    where: Partial<User>,
    options?: UserFindOptions,
  ): Promise<User[]> {
    const userRepository = await this.getUserRepository();
    return userRepository.find({
      where: {
        ...where,
        ...(!options?.globally && { companies: ArrayContains([this.schema]) }),
      },
    });
  }

  // safely check if the email is not already taken in this company
  async checkEmailIsNotTaken(email: string) {
    const user = await this.find_by({ email }, { globally: true });
    if (user) {
      throw new ConflictException('Email already taken');
    }
    return true;
  }

  /** For updates: ensure email is not taken by another user (excluding excludeUserId). */
  async ensure_email_not_taken_by_other_user(
    email: string,
    excludeUserId: string,
  ) {
    const user = await this.find_by({ email }, { globally: true });

    if (user && user.id !== excludeUserId) {
      throw new ConflictException('Email already taken');
    }
  }

  async update(id: string, dto: Partial<User>) {
    const user = await this.find_by_and_fail({ id });
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async create(dto: CreateUserDto) {
    const userRepository = await this.getUserRepository();
    const existingUser = await this.find_by(
      { email: dto.email },
      { globally: true },
    );

    if (existingUser?.companies?.includes(this.schema)) {
      throw new ConflictException('User already exists in this company');
    }

    if (existingUser) {
      await this.addUserToCompany(dto.email, this.schema);
      if (existingUser.deletedAt) {
        await this.restore(existingUser.id);
      }

      return existingUser;
    }
    const user = new User();
    Object.assign(user, {
      ...dto,
      password_digest: dto.password
        ? await bcrypt.hash(dto.password, 10)
        : undefined,
      companies: [this.schema],
    });
    return await userRepository.save(user);
  }

  async addUserToCompany(email: string, schema: string) {
    const user = await this.find_by({ email }, { globally: true });
    const companies = [...new Set([...(user.companies || []), schema])];
    await this.userRepository.update(user.id, { companies });
    return user;
  }

  async removeUserFromCompany(email: string, schema: string) {
    const user = await this.find_by({ email });
    const companies = user.companies.filter((c) => c !== schema);
    await this.userRepository.update(user.id, { companies });
    return user;
  }

  async updatePassword(id: string, password: string) {
    await this.find_by_and_fail({ id });
    const userRepository = await this.getUserRepository();
    await userRepository.update(id, {
      password_digest: await bcrypt.hash(password, 10),
    });
  }

  async softDelete(id: string) {
    const userRepository = await this.getUserRepository();
    await userRepository.softDelete(id);
  }

  async restore(id: string) {
    const userRepository = await this.getUserRepository();
    await userRepository.restore(id);
  }
}
