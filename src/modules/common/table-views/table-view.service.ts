import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
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
import { UpdateUserTableViewColumnsDto } from './dto/update-user-table-view-columns.dto';
import { TableColumn } from './entities/column.entity';

const DEFAULT_WIDTH = 160;

@Injectable()
export class TableViewService {
  private readonly logger = new Logger(TableViewService.name);

  constructor(
    @InjectRepository(UserTableView)
    private readonly viewRepo: Repository<UserTableView>,
    @InjectRepository(UserTableViewColumn)
    private readonly viewColumnRepo: Repository<UserTableViewColumn>,
    private readonly columnService: ColumnService,
    private readonly dataSource: DataSource,
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

  /**
   * Get the logged-in user's view for a given type and include
   * the selected columns (visible=true) sorted by their order.
   * If the view does not exist yet, a default one is created.
   */
  async get_user_view_with_columns(
    user_id: string,
    type: TableViewType,
  ): Promise<UserTableView> {
    let view = await this.find_by(
      { user_id, type },
      { relations: { columns: { column: true } } },
    );

    if (!view) {
      view = await this.create_default_view(type, user_id);
    }

    if (!view) {
      throw new NotFoundException('UserTableView not found');
    }

    if (view.columns) {
      view.columns = view.columns
        .filter((vc) => vc.visible)
        .sort((a, b) => a.order - b.order);
    }

    return view;
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

  /**
   * Replace view columns: add new, update order/visible/width/pinned, remove omitted.
   * Order is taken from array index when item.order is undefined.
   */
  async update_columns(view_id: string, dto: UpdateUserTableViewColumnsDto) {
    const view = await this.find_by(
      { id: view_id },
      { relations: { columns: { column: true } } },
    );

    if (!view) {
      throw new NotFoundException('UserTableView not found');
    }

    // validate that all requested columns are allowed for this view type
    // allow both COMMON columns and columns specific to this view type
    const allowedColumns = await this.columnService.find_all({
      view_type: In([TableViewType.COMMON, view.type]),
    });
    const allowedColumnIds = new Set(allowedColumns.map((c) => c.id));

    for (const col of dto.columns) {
      if (!allowedColumnIds.has(col.id)) {
        throw new BadRequestException('Invalid column id for this view type');
      }
    }

    const existingColumns = view.columns ?? [];
    const existingByColumnId = new Map(
      existingColumns.map((vc) => [vc.column_id, vc]),
    );

    const payloadColumnIds = dto.columns.map((c) => c.id);
    const payloadColumnIdSet = new Set(payloadColumnIds);

    // columns to remove (omitted from payload)
    const toRemove = existingColumns.filter(
      (vc) => !payloadColumnIdSet.has(vc.column_id),
    );

    const toSave: UserTableViewColumn[] = [];

    dto.columns.forEach((item, index) => {
      const order = item.order ?? index;
      const existing = existingByColumnId.get(item.id);

      if (existing) {
        existing.order = order;
        if (item.visible) {
          existing.visible = item.visible;
        }
        if (item.width) {
          existing.width = item.width;
        }
        if (item.pinned) {
          existing.pinned = item.pinned;
        }
        toSave.push(existing);
      } else {
        const created = this.viewColumnRepo.create({
          view_id,
          column_id: item.id,
          order,
          visible: item.visible ?? true,
          width: item.width ?? DEFAULT_WIDTH,
          pinned: item.pinned ?? false,
        });
        toSave.push(created);
      }
    });

    await this.dataSource.transaction(async (manager) => {
      if (toRemove.length) {
        await manager.remove(toRemove);
      }
      if (toSave.length) {
        await manager.save(toSave);
      }
    });

    // refresh and return updated view with columns
    const updatedView = await this.find_by(
      { id: view_id },
      { relations: { columns: { column: true } } },
    );

    if (!updatedView) {
      throw new NotFoundException('UserTableView not found after update');
    }

    return updatedView;
  }

  async get_all_columns(view_type: TableViewType): Promise<TableColumn[]> {
    // always return COMMON columns + requested view type columns
    return await this.columnService.find_all(
      {
        view_type: In([TableViewType.COMMON, view_type]),
      },
      { order: { name: 'ASC' } },
    );
  }
}
