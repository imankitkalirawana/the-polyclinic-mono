import { Drug } from './entities/drug.entity';
import { ArrayContains, FindOptionsWhere } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { getTenantConnection } from 'src/common/db/tenant-connection';
import { DrugFindOptions } from './drug.types';
import { ClsService } from 'nestjs-cls';
import { SCHEMA_KEY } from '@libs/schema/schema.constants';

@Injectable()
export class DrugService {
  constructor(private readonly cls: ClsService) {}

  private get schema(): string {
    return this.cls.get(SCHEMA_KEY);
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
