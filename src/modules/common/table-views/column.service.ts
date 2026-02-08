import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeleteResult,
  FindManyOptions,
  FindOptionsWhere,
  Repository,
  UpdateResult,
} from 'typeorm';
import { TableColumn } from './entities/column.entity';
import { CreateTableColumnDto } from './dto/create-table-column.dto';
import { UpdateTableColumnDto } from './dto/update-table-column.dto';

@Injectable()
export class ColumnService {
  constructor(
    @InjectRepository(TableColumn)
    private readonly tableColumnRepo: Repository<TableColumn>,
  ) {}

  async find_by(
    where: FindOptionsWhere<TableColumn>,
    options?: FindManyOptions<TableColumn>,
  ): Promise<TableColumn[]> {
    return await this.tableColumnRepo.find({ where, ...options });
  }

  async find_all(
    where: FindOptionsWhere<TableColumn>,
    options?: FindManyOptions<TableColumn>,
  ): Promise<TableColumn[]> {
    return await this.tableColumnRepo.find({ where, ...options });
  }

  async create(
    createTableColumnDto: CreateTableColumnDto,
  ): Promise<TableColumn> {
    return await this.tableColumnRepo.save(createTableColumnDto);
  }

  async update(
    id: string,
    updateTableColumnDto: UpdateTableColumnDto,
  ): Promise<UpdateResult> {
    return await this.tableColumnRepo.update(id, updateTableColumnDto);
  }

  //   delete_by
  async delete_by(where: FindOptionsWhere<TableColumn>): Promise<DeleteResult> {
    return await this.tableColumnRepo.softDelete(where);
  }

  async delete(id: string): Promise<DeleteResult> {
    return await this.tableColumnRepo.softDelete(id);
  }

  async delete_hard(id: string): Promise<DeleteResult> {
    return await this.tableColumnRepo.delete(id);
  }
}
