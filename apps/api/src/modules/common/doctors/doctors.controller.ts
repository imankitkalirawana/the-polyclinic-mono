import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { SpecializationsService } from './specializations.service';
import { BearerAuthGuard } from '@auth/guards/bearer-auth.guard';
import { RolesGuard } from '@auth/guards/roles.guard';
import { Roles } from '@auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@auth/decorators/current-user.decorator';
import { formatDoctor } from './doctors.helper';
import { Request } from 'express';
import { ILike } from 'typeorm';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { UserRole } from '@repo/store';

@Controller('doctors')
@UseGuards(BearerAuthGuard, RolesGuard)
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly specializationsService: SpecializationsService,
  ) {}

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT,
  )
  async find_all(@Req() req: Request, @Query('search') search?: string) {
    const doctors = await this.doctorsService.find_all({
      user: { name: ILike(`%${search}%`) },
    });
    const formattedDoctors = doctors.map((doctor) =>
      formatDoctor(doctor, req.user.role),
    );
    const categoriesById = new Map(
      doctors
        .flatMap((d) => d.specializations ?? [])
        .filter((s) => s?.id != null)
        .map((s) => [
          s.id,
          {
            id: s.id,
            name: s.name,
            slug: s.slug,
            description: s.description,
          },
        ]),
    );
    const categories = [...categoriesById.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    return { doctors: formattedDoctors, categories };
  }

  @Get('me')
  async get_me(@CurrentUser() user: CurrentUserPayload) {
    return this.doctorsService.find_by_and_fail({ user_id: user.user_id });
  }

  /* This should be defined before :id route */
  @Get('specializations')
  @Roles(
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT,
  )
  async list_specializations() {
    const specializations = await this.specializationsService.find_all();
    return specializations;
  }

  @Post('specializations')
  @Roles(UserRole.ADMIN)
  async create_specialization(@Body() body: CreateSpecializationDto) {
    const specialization = await this.specializationsService.create(body);
    return specialization;
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  async find_one(@Req() req: Request, @Param('id') id: string) {
    const doctor = await this.doctorsService.find_by_and_fail({ id });
    return formatDoctor(doctor, req.user.role);
  }
}
