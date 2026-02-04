import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { ArrayContains, Repository } from 'typeorm';
import { Doctor } from '@/common/doctors/entities/doctor.entity';
import { getTenantConnection } from 'src/common/db/tenant-connection';

import { UsersService } from '@/auth/users/users.service';
import { UpdateDoctorProfileDto } from '@/auth/users/dto/update-profile.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly usersService: UsersService,
  ) {}

  private async getConnection() {
    return await getTenantConnection(this.request.schema);
  }

  private async getDoctorRepository(): Promise<Repository<Doctor>> {
    const connection = await this.getConnection();
    return connection.getRepository(Doctor);
  }

  private getActor() {
    const actor = this.request?.user;
    return {
      actorUserId: actor?.userId ?? null,
      actorRole: actor?.role ?? null,
    };
  }

  async findAll(search?: string) {
    const repo = await this.getDoctorRepository();
    const baseWhere = {
      user: { companies: ArrayContains([this.request.schema]) },
    };

    if (search?.trim()) {
      const term = `%${search.trim()}%`;

      return repo
        .createQueryBuilder('doctor')
        .leftJoinAndSelect('doctor.user', 'user')
        .where('user.companies @> :companies', {
          companies: [this.request.schema],
        })
        .andWhere(
          `(user.name ILIKE :term 
            OR user.email ILIKE :term 
            OR user.phone ILIKE :term)`,
        )
        .setParameter('term', term)
        .getMany();
    }
    const doctors = await repo.find({
      where: baseWhere,
      relations: ['user'],
    });
    return doctors;
  }

  async findOne(id: string) {
    const doctorRepository = await this.getDoctorRepository();
    const doctor = await doctorRepository.findOne({
      where: {
        id,
        user: {
          companies: ArrayContains([this.request.schema]),
        },
      },
      relations: ['user'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async findByUserId(userId: string, skipRelations?: boolean) {
    const doctorRepository = await this.getDoctorRepository();
    const doctor = await doctorRepository.findOne({
      where: { user_id: userId },
      relations: skipRelations ? undefined : ['user'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async updateByUserId(userId: string, dto: UpdateDoctorProfileDto) {
    const repo = await this.getDoctorRepository();
    if (dto && Object.keys(dto).length > 0) {
      await repo.update({ user_id: userId }, dto);
    }
    return this.findByUserId(userId);
  }

  /**
   * Create doctor profile for an already created user.
   * Used by the unified user profile creation flow.
   */
  async createForUser(userId: string, dto: UpdateDoctorProfileDto) {
    const repo = await this.getDoctorRepository();
    const doctor = repo.create({
      user_id: userId,
      ...dto,
    });
    return repo.save(doctor);
  }
}
