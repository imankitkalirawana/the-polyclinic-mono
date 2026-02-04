import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Role } from 'src/common/enums/role.enum';
import { User } from '../entities/user.entity';
import { UsersService } from './users.service';
import { DoctorsService } from '@/common/doctors/doctors.service';
import { PatientsService } from '@/common/patients/patients.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateProfileDto } from './dto/create-profile.dto';

export type UserProfileResponse =
  | {
      user: User;
      doctor: Awaited<ReturnType<typeof DoctorsService.prototype.findByUserId>>;
    }
  | {
      user: User;
      patient: Awaited<
        ReturnType<typeof PatientsService.prototype.findByUserId>
      >;
    }
  | { user: User; doctor?: never; patient?: never };

/**
 * Unified profile service: get/update user + role-specific profile (Doctor/Patient)
 * in one place. Scalable: add new roles by extending getProfile/updateProfile switch.
 */
@Injectable()
export class UserProfileService {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly usersService: UsersService,
    private readonly doctorsService: DoctorsService,
    private readonly patientsService: PatientsService,
  ) {}

  private get schema(): string {
    return this.request.schema;
  }

  /**
   * Get user and integrated role profile for the "Update a User" form.
   * Returns user + doctor or user + patient based on user.role.
   */
  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    switch (user.role) {
      case Role.DOCTOR:
        const doctor = await this.doctorsService.findByUserId(userId, true);
        return { user, doctor };
      case Role.PATIENT:
        const patient = await this.patientsService.findByUserId(userId, true);
        return { user, patient };
      default:
        return { user };
    }
  }

  /**
   * Update both user (name, email, phone) and role-specific profile in one flow.
   * Validates email uniqueness when email is changed; applies only the role block
   * matching the user's role.
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileResponse> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.user?.email && dto.user?.email !== user.email) {
      await this.usersService.ensureEmailNotTakenByOtherUser(
        dto.user?.email,
        userId,
      );
    }

    const base = {
      name: dto.user?.name,
      email: dto.user?.email,
      phone: dto.user?.phone,
    };
    if (Object.keys(base).length > 0) {
      await this.usersService.update(userId, base);
    }

    console.debug('dto in user-profile.service.ts', dto);

    switch (user.role) {
      case Role.DOCTOR:
        await this.doctorsService.updateByUserId(userId, dto.doctor);
        break;
      case Role.PATIENT:
        await this.patientsService.updateByUserId(userId, dto.patient);
        break;
    }

    return this.getProfile(userId);
  }

  /**
   * Create a new user and the corresponding role-specific profile (doctor/patient)
   * in a single unified flow.
   */
  async createProfile(dto: CreateProfileDto): Promise<UserProfileResponse> {
    // First create the base user
    const user = await this.usersService.create(dto.user);

    // Then create role-specific profile based on the created user's role
    switch (user.role) {
      case Role.DOCTOR:
        if (dto.doctor) {
          await this.doctorsService.createForUser(user.id, dto.doctor);
        }
        break;
      case Role.PATIENT:
        if (dto.patient) {
          await this.patientsService.createForUser(user.id, dto.patient);
        }
        break;
    }

    return this.getProfile(user.id);
  }
}
