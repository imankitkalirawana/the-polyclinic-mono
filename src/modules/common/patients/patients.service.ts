import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { ArrayContains, FindOptionsWhere } from 'typeorm';
import { CreatePatientDto } from './dto/create-patient.dto';
import { getTenantConnection } from 'src/common/db/tenant-connection';
import { UserService } from '@/auth/users/users.service';
import { Patient } from '@/common/patients/entities/patient.entity';
import { Role } from 'src/scripts/types';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UpdatePatientProfileDto } from '@/auth/users/dto/update-profile.dto';
import { PatientFindOptions } from './patient.types';

@Injectable()
export class PatientsService {
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

  private async getPatientRepository() {
    const connection = await this.getConnection();
    return connection.getRepository(Patient);
  }

  async find_by(
    where: FindOptionsWhere<Patient>,
    options: PatientFindOptions = {
      relations: { user: true },
    },
  ): Promise<Patient | null> {
    const { globally, ...rest } = options;
    const patientRepository = await this.getPatientRepository();
    return patientRepository.findOne({
      where: {
        ...where,
        ...(!globally && { user: { companies: ArrayContains([this.schema]) } }),
      },
      ...rest,
    });
  }

  async find_by_and_fail(
    where: FindOptionsWhere<Patient>,
    options: PatientFindOptions = {},
  ): Promise<Patient> {
    const patient = await this.find_by(where, options);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }

  // find_all
  async find_all(
    where: FindOptionsWhere<Patient>,
    options: PatientFindOptions = {
      relations: { user: true },
    },
  ): Promise<Patient[]> {
    const { globally, ...rest } = options;
    const patientRepository = await this.getPatientRepository();
    return patientRepository.find({
      where: {
        ...where,
        ...(!globally && { user: { companies: ArrayContains([this.schema]) } }),
      },
      ...rest,
    });
  }

  async create(createPatientDto: CreatePatientDto) {
    const user = await this.userService.create({
      email: createPatientDto.email,
      name: createPatientDto.name,
      phone: createPatientDto.phone,
      password: createPatientDto.password,
      role: Role.PATIENT,
      companies: [this.schema],
    });

    const patientRepository = await this.getPatientRepository();
    const patient = await patientRepository.save({
      user_id: user.id,
      gender: createPatientDto.gender,
      dob: createPatientDto.dob,
      address: createPatientDto.address,
    });

    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    const repo = await this.getPatientRepository();
    const updatedPatient = await repo.update(id, updatePatientDto);

    if (updatedPatient.affected === 0) {
      throw new NotFoundException('Patient not found');
    }

    return this.find_by_and_fail({ id });
  }

  /** Update patient profile by user id (used by profile service). */
  async update_by_user_id(userId: string, dto: UpdatePatientProfileDto) {
    const repo = await this.getPatientRepository();
    if (dto && Object.keys(dto).length > 0) {
      await repo.update({ user_id: userId }, dto);
    }
    return this.find_by_and_fail({ user_id: userId });
  }
  /**
   * Create patient profile for an already created user.
   * Used by the unified user profile creation flow.
   */
  async create_for_user(userId: string, dto: UpdatePatientProfileDto) {
    const repo = await this.getPatientRepository();
    const patient = repo.create({
      user_id: userId,
      ...dto,
    });
    return repo.save(patient);
  }

  async remove(_patientId: string) {}

  async restore(_patientId: string) {}
}
