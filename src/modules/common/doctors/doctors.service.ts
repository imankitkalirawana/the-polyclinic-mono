import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { ArrayContains, FindOptionsWhere, Repository } from 'typeorm';
import { Doctor } from '@/common/doctors/entities/doctor.entity';
import { getTenantConnection } from 'src/common/db/tenant-connection';

import { UserService } from '@/auth/users/users.service';
import { UpdateDoctorProfileDto } from '@/auth/users/dto/update-profile.dto';
import { DoctorFindOptions } from './doctor.types';

@Injectable()
export class DoctorsService {
  private readonly schema: string;
  constructor(
    @Inject(REQUEST) private request: Request,
    private readonly userService: UserService,
  ) {
    this.schema = this.request.schema;
  }

  private async getConnection() {
    return await getTenantConnection(this.schema);
  }

  private async getDoctorRepository(): Promise<Repository<Doctor>> {
    const connection = await this.getConnection();
    return connection.getRepository(Doctor);
  }

  async find_by(
    where: FindOptionsWhere<Doctor>,
    options: DoctorFindOptions = {},
  ): Promise<Doctor | null> {
    const { globally, ...rest } = options;
    const doctorRepository = await this.getDoctorRepository();
    return doctorRepository.findOne({
      where: {
        ...where,
        ...(!globally && { user: { companies: ArrayContains([this.schema]) } }),
      },
      ...rest,
    });
  }

  async find_by_and_fail(
    where: FindOptionsWhere<Doctor>,
    options: DoctorFindOptions = {},
  ): Promise<Doctor> {
    const doctor = await this.find_by(where, options);
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    return doctor;
  }

  async find_all(
    where: FindOptionsWhere<Doctor>,
    options: DoctorFindOptions = {},
  ): Promise<Doctor[]> {
    const { globally, ...rest } = options;
    const doctorRepository = await this.getDoctorRepository();
    return doctorRepository.find({
      where: {
        ...where,
        ...(!globally && { user: { companies: ArrayContains([this.schema]) } }),
      },
      ...rest,
    });
  }

  async update_by_user_id(userId: string, dto: UpdateDoctorProfileDto) {
    const repo = await this.getDoctorRepository();
    if (dto && Object.keys(dto).length > 0) {
      await repo.update({ user_id: userId }, dto);
    }
    return this.find_by_and_fail({ user_id: userId });
  }

  /**
   * Create doctor profile for an already created user.
   * Used by the unified user profile creation flow.
   */
  async create_for_user(userId: string, dto: UpdateDoctorProfileDto) {
    const repo = await this.getDoctorRepository();
    const doctor = repo.create({
      user_id: userId,
      ...dto,
    });
    return repo.save(doctor);
  }
}
