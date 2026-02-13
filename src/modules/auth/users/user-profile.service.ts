import { Injectable } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';
import { User } from '../entities/user.entity';
import { UserService } from './users.service';
import { DoctorsService } from '@common/doctors/doctors.service';
import { PatientsService } from '@common/patients/patients.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { generateDoctorCode } from '@common/doctors/doctors.helper';
import { EmailService } from '@common/email/email.service';

export type UserProfileResponse =
  | {
      user: User;
      doctor: Awaited<
        ReturnType<typeof DoctorsService.prototype.find_by_and_fail>
      >;
    }
  | {
      user: User;
      patient: Awaited<
        ReturnType<typeof PatientsService.prototype.find_by_and_fail>
      >;
    }
  | { user: User; doctor?: never; patient?: never };

@Injectable()
export class UserProfileService {
  constructor(
    private readonly userService: UserService,
    private readonly doctorsService: DoctorsService,
    private readonly patientsService: PatientsService,
    private readonly emailService: EmailService,
  ) {}

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.userService.find_by_and_fail({ id: userId });

    switch (user.role) {
      case Role.DOCTOR:
        const doctor = await this.doctorsService.find_by_and_fail({
          user_id: userId,
        });
        return { user, doctor };
      case Role.PATIENT:
        const patient = await this.patientsService.find_by_and_fail({
          user_id: userId,
        });
        return { user, patient };
      default:
        return { user };
    }
  }

  async createProfile(dto: CreateProfileDto): Promise<UserProfileResponse> {
    // First create the base user
    const user = await this.userService.create(dto.user);

    // Then create role-specific profile based on the created user's role
    switch (user.role) {
      case Role.DOCTOR:
        if (dto.doctor) {
          if (!dto.doctor.code) {
            dto.doctor.code = generateDoctorCode(user.name);
          }
          await this.doctorsService.create_for_user(user.id, dto.doctor);
        }
        break;
      case Role.PATIENT:
        if (dto.patient) {
          await this.patientsService.create_for_user(user.id, dto.patient);
        }
        break;
    }

    this.emailService.sendEmail({
      to: user.email,
      subject: 'Welcome to the platform',
      html: '<p>Welcome to the platform</p>',
    });

    return this.getProfile(user.id);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileResponse> {
    const user = await this.userService.find_by_and_fail({ id: userId });

    if (dto.user?.email && dto.user?.email !== user.email) {
      await this.userService.ensure_email_not_taken_by_other_user(
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
      await this.userService.update(userId, base);
    }

    switch (user.role) {
      case Role.DOCTOR:
        await this.doctorsService.update_by_user_id(userId, dto.doctor);
        break;
      case Role.PATIENT:
        await this.patientsService.update_by_user_id(userId, dto.patient);
        break;
    }

    return this.getProfile(userId);
  }
}
