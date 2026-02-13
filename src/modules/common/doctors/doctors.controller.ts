import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { BearerAuthGuard } from '@auth/guards/bearer-auth.guard';
import { RolesGuard } from '@auth/guards/roles.guard';
import { Roles } from '@auth/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@auth/decorators/current-user.decorator';
import { formatDoctor } from './doctors.helper';
import { Request } from 'express';
import { ILike } from 'typeorm';

@Controller('doctors')
@UseGuards(BearerAuthGuard, RolesGuard)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.PATIENT)
  async find_all(@Req() req: Request, @Query('search') search?: string) {
    const doctors = await this.doctorsService.find_all({
      user: { name: ILike(`%${search}%`) },
    });
    return doctors.map((doctor) => formatDoctor(doctor, req.user.role));
  }

  @Get('me')
  async get_me(@CurrentUser() user: CurrentUserPayload) {
    return this.doctorsService.find_by_and_fail({ user_id: user.user_id });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST)
  async find_one(@Req() req: Request, @Param('id') id: string) {
    const doctor = await this.doctorsService.find_by_and_fail({ id });
    return formatDoctor(doctor, req.user.role);
  }
}
