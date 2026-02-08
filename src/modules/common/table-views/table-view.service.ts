import { Inject, Injectable, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { Request } from 'express';
import { TableViewType, UserTableView } from './entities/table-view.entity';
import { ColumnService } from './column.service';

@Injectable()
export class TableViewService {
  private readonly logger = new Logger(TableViewService.name);

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    @InjectRepository(UserTableView)
    private readonly viewRepo: Repository<UserTableView>,
    private readonly columnService: ColumnService,
  ) {}

  async find_by(
    where: FindOptionsWhere<UserTableView>,
    options?: FindManyOptions<UserTableView>,
  ): Promise<UserTableView> {
    return await this.viewRepo.findOne({ where, ...options });
  }

  async find_all(
    where: FindOptionsWhere<UserTableView>,
    options?: FindManyOptions<UserTableView>,
  ): Promise<UserTableView[]> {
    return await this.viewRepo.find({ where, ...options });
  }

  async create_default_view(
    type: TableViewType,
    user_id?: string,
  ): Promise<UserTableView> {
    const uid = user_id ?? this.request.user?.userId;
    if (!uid) {
      throw new Error(
        'user_id is required when not in request context (e.g. use getWithRequest(TableViewService, { user: { userId: "..." } }) in REPL)',
      );
    }
    const existingView = await this.find_by({ type, user_id: uid });

    if (existingView) {
      return existingView;
    }

    return await this.viewRepo.save({
      name: `Default ${type} View`,
      type,
      user_id: uid,
    });
  }
}
