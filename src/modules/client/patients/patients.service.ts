import {
  Injectable,
  NotFoundException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Patient } from './entities/patient.entity';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { ILike, Repository } from 'typeorm';
import { formatPatient } from './patients.helper';
import { CreatePatientDto } from './dto/create-patient.dto';
import { getTenantConnection } from 'src/common/db/tenant-connection';
import { subYears } from 'date-fns';
import { UsersService } from '@/auth/users/users.service';
import { Role } from 'src/scripts/types';

@Injectable()
export class PatientsService {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly usersService: UsersService,
  ) {}

  private getTenantSlug(): string {
    console.log('Tenant slug:', this.request.tenantSlug);
    const tenantSlug = this.request.tenantSlug;
    if (!tenantSlug) {
      throw new NotFoundException('Tenant schema not available');
    }
    return tenantSlug;
  }

  private async getPatientRepository(): Promise<Repository<Patient>> {
    const connection = await getTenantConnection(this.getTenantSlug());
    return connection.getRepository(Patient);
  }

  private calculateDob(age: number): Date {
    const currentDate = new Date();
    const dob = subYears(currentDate, age);
    return dob;
  }

  async create(createPatientDto: CreatePatientDto) {
    const patientRepository = await this.getPatientRepository();

    const user = await this.usersService.findOneOrCreateByEmail({
      email: createPatientDto.email,
      name: createPatientDto.name,
      phone: createPatientDto.phone,
      password: createPatientDto.password,
    });

    if (!user) {
      throw new NotFoundException(
        `User with email ${createPatientDto.email} not found`,
      );
    }

    if (user.role !== Role.PATIENT) {
      throw new BadRequestException('User is not a patient');
    }

    // check if patient already exists
    const existingPatient = await patientRepository.findOne({
      where: { user_id: user.id },
    });
    if (existingPatient) {
      throw new BadRequestException('Patient already exists');
    }

    return await patientRepository.save({
      ...createPatientDto,
      user_id: user.id,
      dob: this.calculateDob(createPatientDto.age),
    });
  }

  async findAll(search?: string) {
    const repo = await this.getPatientRepository();
    const patients = await repo.find({
      where: search
        ? [
            { user: { name: ILike(`%${search}%`) } },
            { user: { email: ILike(`%${search}%`) } },
            { user: { phone: ILike(`%${search}%`) } },
          ]
        : {},
      relations: ['user'],
      order: {
        user: { name: 'ASC' },
      },
      take: 30,
    });

    return patients.map(formatPatient);
  }

  async findByUserId(userId: string) {
    const repo = await this.getPatientRepository();
    const patient = await repo.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });

    if (!patient) {
      throw new NotFoundException(`Patient with user ID ${userId} not found`);
    }

    return patient;
  }

  async findOne(id: string) {
    const repo = await this.getPatientRepository();
    const patient = await repo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async update(userId: string, updatePatientDto: UpdatePatientDto) {
    const patientRepository = await this.getPatientRepository();
    const patient = await patientRepository.findOne({
      where: { user_id: userId },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with user ID ${userId} not found`);
    }
    Object.assign(patient, updatePatientDto);
    return await patientRepository.save(patient);
  }

  async remove(userId: string) {
    const patientRepository = await this.getPatientRepository();

    const patient = await patientRepository.exists({
      where: { user_id: userId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with user ID ${userId} not found`);
    }

    await patientRepository.softDelete({ user_id: userId } as any);
  }

  async restore(userId: string) {
    const patientRepository = await this.getPatientRepository();

    const patient = await patientRepository.exists({
      where: { user_id: userId },
      withDeleted: true,
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${userId} not found`);
    }

    await patientRepository.restore({ user_id: userId } as any);
  }
}
