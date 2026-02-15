import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Specialization } from './entities/specialization.entity';
import { getTenantConnection } from 'src/common/db/tenant-connection';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { generateSpecializationSlug } from './specialization.helper';

@Injectable()
export class SpecializationsService {
  private readonly schema: string;

  constructor(@Inject(REQUEST) private request: Request) {
    this.schema = this.request.schema;
  }

  private async getConnection() {
    return await getTenantConnection(this.schema);
  }

  private async getSpecializationRepository(): Promise<
    Repository<Specialization>
  > {
    const connection = await this.getConnection();
    return connection.getRepository(Specialization);
  }

  async find_all(
    where: FindOptionsWhere<Specialization> = {},
  ): Promise<Specialization[]> {
    const repo = await this.getSpecializationRepository();
    return repo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async find_by_ids(ids: string[]): Promise<Specialization[]> {
    if (ids.length === 0) return [];
    const repo = await this.getSpecializationRepository();
    return repo.find({ where: { id: In(ids) } });
  }

  async create(dto: CreateSpecializationDto): Promise<Specialization> {
    const repo = await this.getSpecializationRepository();
    const specialization = repo.create({
      ...dto,
      slug: generateSpecializationSlug(dto.name),
    });
    return repo.save(specialization);
  }
}
