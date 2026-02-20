import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DrugService } from './drug.service';
import { BearerAuthGuard } from '@auth/guards/bearer-auth.guard';
import { RolesGuard } from '@auth/guards/roles.guard';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CreateDrugDto, createDrugSchema } from '@repo/store';

@Controller('drugs')
@UseGuards(BearerAuthGuard, RolesGuard)
export class DrugController {
  constructor(private readonly drugService: DrugService) {}

  @Get()
  async findAll() {
    return await this.drugService.find_all({});
  }

  @Post()
  async create(
    @Body(ZodValidationPipe.create(createDrugSchema)) dto: CreateDrugDto,
  ) {
    return await this.drugService.create(dto);
  }
}
