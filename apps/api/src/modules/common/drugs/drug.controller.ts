import { Controller, Get, UseGuards } from '@nestjs/common';
import { DrugService } from './drug.service';
import { BearerAuthGuard } from '@auth/guards/bearer-auth.guard';
import { RolesGuard } from '@auth/guards/roles.guard';

@Controller('drugs')
@UseGuards(BearerAuthGuard, RolesGuard)
export class DrugController {
  constructor(private readonly drugService: DrugService) {}

  @Get()
  async findAll() {
    return await this.drugService.find_all({});
  }
}
