import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { ILike, Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { formatDoctor } from './doctors.helper';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { getTenantConnection } from 'src/common/db/tenant-connection';

@Injectable()
export class DoctorsService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  private getTenantSlug(): string {
    const tenantSlug = (this.request as any)?.tenantSlug;
    if (!tenantSlug) {
      throw new NotFoundException('Tenant schema not available');
    }
    return tenantSlug;
  }

  private async getDoctorRepository(): Promise<Repository<Doctor>> {
    const connection = await getTenantConnection(this.getTenantSlug());
    return connection.getRepository(Doctor);
  }

  async create(createDoctorDto: CreateDoctorDto) {
    if (!createDoctorDto.userId) {
      throw new BadRequestException('User ID is required to create a doctor');
    }

    const repo = await this.getDoctorRepository();
    return await repo.save({
      ...(createDoctorDto as any),
      user_id: createDoctorDto.userId,
    });
  }

  async findAll(search?: string) {
    const doctorRepository = await this.getDoctorRepository();
    const doctors = await doctorRepository.find({
      relations: ['user'],
      where: search
        ? [
            { user: { name: ILike(`%${search}%`) } },
            { designation: ILike(`%${search}%`) },
            { seating: ILike(`%${search}%`) },
          ]
        : {},
    });

    return doctors.map((doctor) =>
      formatDoctor(doctor, (this.request as any).user.role),
    );
  }

  async findOne(id: string) {
    const doctorRepository = await this.getDoctorRepository();

    const doctor = await doctorRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async findByUserId(userId: string) {
    const doctorRepository = await this.getDoctorRepository();

    const doctor = await doctorRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with user ID ${userId} not found`);
    }

    return doctor;
  }

  // update doctor
  async update(userId: string, updateDoctorDto: UpdateDoctorDto) {
    const doctorRepository = await this.getDoctorRepository();
    const doctor = await doctorRepository.findOne({
      where: { user_id: userId },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with user ID ${userId} not found`);
    }
    Object.assign(doctor, updateDoctorDto);
    return await doctorRepository.save(doctor);
  }
}
