import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StandardParam, StandardParams } from 'nest-standard-response';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from '@repo/store';
import { UpdateCompanyDto } from '@repo/store';
import { BearerAuthGuard } from '../guards/bearer-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '@repo/store';

@Controller('auth/companies')
@UseGuards(BearerAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  async create(
    @StandardParam() params: StandardParams,
    @Body() dto: CreateCompanyDto,
  ) {
    const company = await this.companyService.create(dto);
    params.setMessage('Company created successfully');
    return company;
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR)
  async findAll() {
    return await this.companyService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR)
  async findOne(@Param('id') id: string) {
    return await this.companyService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async update(
    @StandardParam() params: StandardParams,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    const company = await this.companyService.update(id, dto);
    params.setMessage('Company updated successfully');
    return company;
  }

  @Delete(':id/soft-remove')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async softRemove(
    @StandardParam() params: StandardParams,
    @Param('id') id: string,
  ) {
    await this.companyService.softRemove(id);
    params.setMessage('Company removed successfully');
    return null;
  }
}
