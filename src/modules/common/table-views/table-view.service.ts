import { Inject, Injectable, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Request } from 'express';
import { UserTableView } from './entities/table-view.entity';
import { ColumnService } from './column.service';
import { ColumnDataType } from './entities/column.entity';
import type {
  TableViewColumnConfig,
  TableViewResult,
} from './table-view.types';

@Injectable()
export class TableViewService {
  private readonly logger = new Logger(TableViewService.name);

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    @InjectRepository(UserTableView)
    private readonly viewRepo: Repository<UserTableView>,
    private readonly columnService: ColumnService,
  ) {}

  /**
   * Returns columns and filters for the queue list.
   * - If viewId is provided and a view owned by the current user exists: use that view's columns and filters.
   * - Otherwise: default columns from TableColumn (queue.*) and empty filters.
   */
  async getViewOrDefault(
    viewId: string | undefined,
    tableKey: string,
  ): Promise<TableViewResult> {
    if (!viewId) {
      const columns = await this.getDefaultColumnConfigs(tableKey);
      return { columns, filters: {} };
    }

    const userId = this.request.user?.userId;
    if (!userId) {
      const columns = await this.getDefaultColumnConfigs(tableKey);
      return { columns, filters: {} };
    }

    const view = await this.viewRepo.findOne({
      where: { id: viewId, user_id: userId },
      relations: { columns: { column: true } },
    });

    if (!view) {
      this.logger.debug(
        `View ${viewId} not found or not owned by user, using default columns`,
      );
      const columns = await this.getDefaultColumnConfigs(tableKey);
      return { columns, filters: {} };
    }

    const columns = this.viewColumnsToConfigs(view.columns);
    const filters = (view.filters ?? {}) as Record<string, unknown>;
    return { columns, filters };
  }

  private async getDefaultColumnConfigs(
    tableKey: string,
  ): Promise<TableViewColumnConfig[]> {
    const tableColumns = await this.columnService.find_by({
      key: Like(`${tableKey}.%`),
    });
    return tableColumns.map((c, index) => ({
      key: c.key,
      name: c.name,
      data_type: c.data_type,
      is_sortable: c.is_sortable,
      order: index,
      visible: true,
      width: 160,
      pinned: false,
    }));
  }

  private viewColumnsToConfigs(
    viewColumns: Array<{
      order: number;
      visible: boolean;
      width: number;
      pinned: boolean;
      column?: {
        key: string;
        name: string;
        data_type: ColumnDataType;
        is_sortable: boolean;
      } | null;
    }>,
  ): TableViewColumnConfig[] {
    const sorted = [...viewColumns].sort((a, b) => a.order - b.order);
    return sorted
      .filter((vc) => vc.column != null)
      .map((vc) => ({
        key: vc.column!.key,
        name: vc.column!.name,
        data_type: vc.column!.data_type,
        is_sortable: vc.column!.is_sortable,
        order: vc.order,
        visible: vc.visible,
        width: vc.width,
        pinned: vc.pinned,
      }));
  }
}
