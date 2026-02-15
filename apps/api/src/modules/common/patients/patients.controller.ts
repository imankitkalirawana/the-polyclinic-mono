import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { BearerAuthGuard } from '@auth/guards/bearer-auth.guard';
import { RolesGuard } from '@auth/guards/roles.guard';
import { Roles } from '@auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@auth/decorators/current-user.decorator';
import { StandardParam, StandardParams } from 'nest-standard-response';
import { CreatePatientDto } from './dto/create-patient.dto';
import { formatPatient } from './patients.helper';
import { ILike } from 'typeorm';
import { Request } from 'express';
import { UserRole } from '@repo/store';

@Controller('patients')
@UseGuards(BearerAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.NURSE)
  async create(
    @Body() createPatientDto: CreatePatientDto,
    @StandardParam() params: StandardParams,
  ) {
    params.setMessage(`Patient created successfully`);

    return this.patientsService.create(createPatientDto);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT,
  )
  async find_all(@Query('search') search?: string) {
    const patients = await this.patientsService.find_all({
      user: { name: ILike(`%${search}%`) },
    });
    return patients.map(formatPatient);
  }

  @Get('me')
  async get_me(@CurrentUser() user: CurrentUserPayload) {
    const patient = await this.patientsService.find_by_and_fail({
      user_id: user.user_id,
    });
    return formatPatient(patient);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT,
  )
  async find_one(@Param('id') id: string, @Req() req: Request) {
    const isPatient = req.user.role === UserRole.PATIENT;
    const patient = await this.patientsService.find_by_and_fail({
      id,
      user_id: isPatient ? req.user.userId : undefined,
    });
    return formatPatient(patient);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return await this.patientsService.remove(id);
  }
}
