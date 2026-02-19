import { Drug } from './entities/drug.entity';
import { ArrayContains, FindOptionsWhere } from 'typeorm';
import { Inject, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { getTenantConnection } from 'src/common/db/tenant-connection';
import { DrugFindOptions } from './drug.types';

export class DrugService {
  private readonly schema: string;

  constructor(@Inject(REQUEST) private request: Request) {
    this.schema = this.request.schema;
  }

  private async getConnection() {
    return await getTenantConnection(this.schema);
  }

  private async getDrugRepository() {
    const connection = await this.getConnection();
    return connection.getRepository(Drug);
  }

  async find_by(
    where: FindOptionsWhere<Drug>,
    options: DrugFindOptions = {},
  ): Promise<Drug | null> {
    const { globally, relations, ...rest } = options;
    const drugRepository = await this.getDrugRepository();
    return drugRepository.findOne({
      where: {
        ...where,
        ...(!globally && { companies: ArrayContains([this.schema]) }),
      },
      ...rest,
      relations,
    });
  }

  async find_by_and_fail(
    where: FindOptionsWhere<Drug>,
    options: DrugFindOptions = {},
  ): Promise<Drug> {
    const drug = await this.find_by(where, options);
    if (!drug) {
      throw new NotFoundException('Drug not found');
    }
    return drug;
  }

  // find_all
  async find_all(
    where: FindOptionsWhere<Drug>,
    options: DrugFindOptions = {},
  ): Promise<Drug[]> {
    const { globally, relations, ...rest } = options;
    const drugRepository = await this.getDrugRepository();
    return drugRepository.find({
      where: {
        ...where,
        ...(!globally && { companies: ArrayContains([this.schema]) }),
      },
      ...rest,
      relations,
    });
  }
}
