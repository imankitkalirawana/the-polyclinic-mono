import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { ArrayContains, Repository } from 'typeorm';
import { Doctor } from '@/public/doctors/entities/doctor.entity';
import {
  DoctorTenantMembership,
  DoctorTenantMembershipStatus,
} from '@/public/doctors/entities/doctor-tenant-membership.entity';
import { formatDoctor } from './doctors.helper';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { getTenantConnection } from 'src/common/db/tenant-connection';
import {
  DoctorMembershipAuditAction,
  DoctorMembershipAuditLog,
} from '@/public/doctors/entities/doctor-membership-audit.entity';
import { UsersService } from '@/auth/users/users.service';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class DoctorsService {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly usersService: UsersService,
  ) {}

  private getTenantSlug(): string {
    const tenantSlug = this.request?.tenantSlug;
    if (!tenantSlug) {
      throw new NotFoundException('Tenant schema not available');
    }
    return String(tenantSlug).trim().toLowerCase();
  }

  private async getConnection() {
    return await getTenantConnection(this.getTenantSlug());
  }

  private async getDoctorRepository(): Promise<Repository<Doctor>> {
    const connection = await this.getConnection();
    return connection.getRepository(Doctor);
  }

  private async getMembershipRepository(): Promise<
    Repository<DoctorTenantMembership>
  > {
    const connection = await this.getConnection();
    return connection.getRepository(DoctorTenantMembership);
  }

  private async getAuditRepository(): Promise<
    Repository<DoctorMembershipAuditLog>
  > {
    const connection = await this.getConnection();
    return connection.getRepository(DoctorMembershipAuditLog);
  }

  private getActor() {
    const actor = this.request?.user;
    return {
      actorUserId: actor?.userId ?? null,
      actorRole: actor?.role ?? null,
    };
  }

  private async auditMembershipChange(args: {
    doctorId: string;
    tenantSlug: string;
    action: DoctorMembershipAuditAction;
    before?: Record<string, any>;
    after?: Record<string, any>;
  }) {
    const repo = await this.getAuditRepository();
    const { actorUserId, actorRole } = this.getActor();
    await repo.save(
      repo.create({
        doctorId: args.doctorId,
        tenantSlug: args.tenantSlug,
        action: args.action,
        actorUserId,
        actorRole,
        before: args.before ?? {},
        after: args.after ?? {},
      }),
    );
  }

  private async assertActiveDoctorMembership(doctorId: string) {
    const tenantSlug = this.getTenantSlug();
    const membershipRepo = await this.getMembershipRepository();
    const membership = await membershipRepo.findOne({
      where: {
        doctorId,
        tenantSlug,
        status: DoctorTenantMembershipStatus.ACTIVE,
      },
      relations: ['doctor', 'doctor.user'],
    });
    if (!membership) {
      throw new NotFoundException('Doctor not found');
    }
    return membership;
  }

  async getDoctorMembership(doctorId: string) {
    return this.assertActiveDoctorMembership(doctorId);
  }

  async create(createDoctorDto: CreateDoctorDto) {}

  async findAll(search?: string) {
    const tenantSlug = this.getTenantSlug();
    const membershipRepo = await this.getMembershipRepository();

    const qb = membershipRepo
      .createQueryBuilder('membership')
      .innerJoinAndSelect('membership.doctor', 'doctor')
      .innerJoinAndSelect('doctor.user', 'user')
      .where('membership.tenant_slug = :tenantSlug', { tenantSlug })
      .andWhere('membership.status = :status', {
        status: DoctorTenantMembershipStatus.ACTIVE,
      })
      .orderBy('user.name', 'ASC')
      .take(100);

    if (search?.trim()) {
      qb.andWhere(
        '(user.name ILIKE :q OR membership.designation ILIKE :q OR membership.seating ILIKE :q)',
        { q: `%${search.trim()}%` },
      );
    }

    const memberships = await qb.getMany();
    return memberships.map((m) =>
      formatDoctor(m.doctor, this.request.user.role, m),
    );
  }

  async findOne(id: string) {
    const doctorRepository = await this.getDoctorRepository();
    const doctor = await doctorRepository.findOne({
      where: { id, user: { companies: ArrayContains([this.getTenantSlug()]) } },
      relations: ['user'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async findByUserId(userId: string) {
    const doctorRepository = await this.getDoctorRepository();
    const doctor = await doctorRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    const membership = await this.assertActiveDoctorMembership(doctor.id);
    return formatDoctor(doctor, this.request.user.role, membership);
  }

  // update doctor
  async update(userId: string, updateDoctorDto: UpdateDoctorDto) {
    const tenantSlug = this.getTenantSlug();
    const doctorRepository = await this.getDoctorRepository();
    const membershipRepo = await this.getMembershipRepository();

    const doctor = await doctorRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    await this.assertActiveDoctorMembership(doctor.id);

    // Global fields
    if (updateDoctorDto.specialization !== undefined) {
      doctor.specialization = updateDoctorDto.specialization;
    }
    if (updateDoctorDto.experience !== undefined) {
      doctor.experience = updateDoctorDto.experience;
    }
    if (updateDoctorDto.education !== undefined) {
      doctor.education = updateDoctorDto.education;
    }
    if (updateDoctorDto.biography !== undefined) {
      doctor.biography = updateDoctorDto.biography;
    }
    await doctorRepository.save(doctor);

    // Tenant fields in membership
    const membership = await membershipRepo.findOne({
      where: {
        doctorId: doctor.id,
        tenantSlug,
      },
    });
    if (!membership) throw new NotFoundException('Doctor not found');

    if (updateDoctorDto.code !== undefined)
      membership.code = updateDoctorDto.code;
    if (updateDoctorDto.designation !== undefined)
      membership.designation = updateDoctorDto.designation;
    if (updateDoctorDto.seating !== undefined)
      membership.seating = updateDoctorDto.seating;
    if (updateDoctorDto.departments !== undefined)
      membership.departments = updateDoctorDto.departments;

    await membershipRepo.save(membership);
    return formatDoctor(doctor, this.request.user.role, membership);
  }
}
