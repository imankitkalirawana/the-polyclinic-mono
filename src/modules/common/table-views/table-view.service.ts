import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOptionsWhere,
  Repository,
  UpdateResult,
} from 'typeorm';
import { TableViewType, UserTableView } from './entities/table-view.entity';
import { UserTableViewColumn } from './entities/table-view-column.entity';
import { ColumnService } from './column.service';
import { UpdateUserTableViewDto } from './dto/update-table-view.dto';

@Injectable()
export class TableViewService {
  private readonly logger = new Logger(TableViewService.name);

  constructor(
    @InjectRepository(UserTableView)
    private readonly viewRepo: Repository<UserTableView>,
    @InjectRepository(UserTableViewColumn)
    private readonly viewColumnRepo: Repository<UserTableViewColumn>,
    private readonly columnService: ColumnService,
  ) {}

  async find_by(
    where: FindOptionsWhere<UserTableView>,
    options?: FindManyOptions<UserTableView>,
  ): Promise<UserTableView | null> {
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
    user_id: string,
  ): Promise<UserTableView> {
    const existingView = await this.find_by(
      { type, user_id },
      { relations: { columns: { column: true } } },
    );

    if (existingView) {
      return existingView;
    }

    const view = await this.viewRepo.save({
      name: `Default ${type} View`,
      type,
      user_id,
    });

    if (type === TableViewType.QUEUE) {
      const tableColumns = await this.columnService.find_all(
        { view_type: type },
        { order: { key: 'ASC' } },
      );

      await this.viewColumnRepo.save(
        tableColumns.map((col, index) => ({
          view_id: view.id,
          column_id: col.id,
          order: index,
          visible: true,
          width: 160,
          pinned: false,
        })),
      );
    }

    // refresh view with columns
    return await this.find_by(
      { id: view.id },
      { relations: { columns: { column: true } } },
    );
  }

  // update_by
  async update_by(
    where: FindOptionsWhere<UserTableView>,
    update: UpdateUserTableViewDto,
  ): Promise<UpdateResult> {
    return await this.viewRepo.update(where, update);
  }
}
