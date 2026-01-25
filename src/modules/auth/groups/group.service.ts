import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Company } from '../entities/company.entity';
import { Group } from '../entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { SchemaValidatorService } from '../schema/schema-validator.service';

@Injectable()
export class GroupService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly schemaValidator: SchemaValidatorService,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(dto: CreateGroupDto): Promise<Group> {
    const company = await this.companyRepository.findOne({
      where: { id: dto.company_id, deleted: false },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const existingUnique = await this.groupRepository.findOne({
      where: { unique_id: dto.unique_id },
    });
    if (existingUnique) {
      throw new ConflictException('Group unique_id already exists');
    }

    const schema = this.schemaValidator.normalizeAndValidateSchemaName(
      dto.schema,
    );

    // Ensure schema exists (idempotent) so schema switching can rely on it.
    await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

    const group = this.groupRepository.create({
      company_id: dto.company_id,
      name: dto.name,
      unique_id: dto.unique_id,
      schema,
      company_type: dto.company_type,
      time_zone: dto.time_zone ?? company.time_zone ?? 'UTC',
      configuration: dto.configuration ?? {},
      deleted: false,
    });

    return await this.groupRepository.save(group);
  }

  async findAll(): Promise<Group[]> {
    return await this.groupRepository.find({
      where: { deleted: false },
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id, deleted: false },
      relations: ['company'],
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async update(id: string, dto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id);

    if (dto.schema) {
      const schema = this.schemaValidator.normalizeAndValidateSchemaName(
        dto.schema,
      );
      await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      group.schema = schema;
    }

    Object.assign(group, {
      ...dto,
      configuration: dto.configuration ?? group.configuration,
    });

    return await this.groupRepository.save(group);
  }

  async softRemove(id: string): Promise<void> {
    const group = await this.findOne(id);
    group.deleted = true;
    await this.groupRepository.save(group);
  }
}
