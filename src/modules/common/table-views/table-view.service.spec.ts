import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TableViewService } from './table-view.service';
import { ColumnService } from './column.service';
import { UserTableView } from './entities/table-view.entity';
import { UserTableViewColumn } from './entities/table-view-column.entity';
import { TableViewType } from './enums/table-view-type.enum';
import { TableColumn } from './entities/column.entity';
import { UpdateUserTableViewColumnsDto } from './dto/update-user-table-view-columns.dto';

const VIEW_ID = 'view-uuid-1';
const USER_ID = 'user-uuid-1';
const COL_ID_A = 'column-uuid-a';
const COL_ID_B = 'column-uuid-b';
const COL_ID_C = 'column-uuid-c';

function viewColumn(
  id: string,
  viewId: string,
  columnId: string,
  order: number,
  overrides: Partial<
    Pick<UserTableViewColumn, 'visible' | 'width' | 'pinned'>
  > = {},
): UserTableViewColumn {
  const vc = new UserTableViewColumn();
  vc.id = id;
  vc.view_id = viewId;
  vc.column_id = columnId;
  vc.order = order;
  vc.visible = true;
  vc.width = 160;
  vc.pinned = false;
  Object.assign(vc, overrides);
  return vc;
}

function tableColumn(id: string): TableColumn {
  const c = new TableColumn();
  c.id = id;
  c.key = `key-${id}`;
  c.name = `Col ${id}`;
  return c;
}

function viewWithColumns(columns: UserTableViewColumn[]): UserTableView {
  const v = new UserTableView();
  v.id = VIEW_ID;
  v.name = 'Default View';
  v.type = TableViewType.QUEUE;
  v.user_id = USER_ID;
  v.columns = columns;
  return v;
}

describe('TableViewService', () => {
  let service: TableViewService;
  let viewRepoFindOne: jest.Mock;
  let viewColumnRepoCreate: jest.Mock;
  let columnServiceFindAll: jest.Mock;
  let managerSoftRemove: jest.Mock;
  let managerSave: jest.Mock;

  beforeEach(async () => {
    viewRepoFindOne = jest.fn();
    viewColumnRepoCreate = jest.fn((input) => {
      const vc = new UserTableViewColumn();
      Object.assign(vc, input);
      return vc;
    });
    columnServiceFindAll = jest.fn();
    managerSoftRemove = jest.fn().mockResolvedValue(undefined);
    managerSave = jest.fn().mockResolvedValue(undefined);
    const mockManager = {
      softRemove: managerSoftRemove,
      save: managerSave,
    };
    const mockDataSource = {
      transaction: jest.fn((fn: (manager: unknown) => Promise<void>) =>
        fn(mockManager),
      ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TableViewService,
        {
          provide: getRepositoryToken(UserTableView),
          useValue: { findOne: viewRepoFindOne },
        },
        {
          provide: getRepositoryToken(UserTableViewColumn),
          useValue: { create: viewColumnRepoCreate },
        },
        {
          provide: ColumnService,
          useValue: { find_all: columnServiceFindAll },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = moduleRef.get(TableViewService);
  });

  describe('update_columns', () => {
    it('throws NotFoundException when view does not exist', async () => {
      viewRepoFindOne.mockResolvedValue(null);

      await expect(
        service.update_columns(VIEW_ID, {
          columns: [{ column_id: COL_ID_A }],
        }),
      ).rejects.toThrow(NotFoundException);

      expect(viewRepoFindOne).toHaveBeenCalledWith({
        where: { id: VIEW_ID },
        relations: { columns: { column: true } },
      });
    });

    it('throws BadRequestException when column_id is not valid for view type', async () => {
      const view = viewWithColumns([]);
      viewRepoFindOne.mockResolvedValueOnce(view).mockResolvedValueOnce(view);
      columnServiceFindAll.mockResolvedValue([tableColumn(COL_ID_A)]);
      const invalidColumnId = 'invalid-column-uuid';

      await expect(
        service.update_columns(VIEW_ID, {
          columns: [{ column_id: COL_ID_A }, { column_id: invalidColumnId }],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(columnServiceFindAll).toHaveBeenCalledWith({
        view_type: TableViewType.QUEUE,
      });
    });

    it('adds new columns and uses defaults when column_id not in view', async () => {
      const existingVc = viewColumn('vc-1', VIEW_ID, COL_ID_A, 0);
      const view = viewWithColumns([existingVc]);
      const allowedCols = [
        tableColumn(COL_ID_A),
        tableColumn(COL_ID_B),
        tableColumn(COL_ID_C),
      ];
      viewRepoFindOne
        .mockResolvedValueOnce(view)
        .mockResolvedValueOnce(
          viewWithColumns([
            existingVc,
            viewColumn('vc-2', VIEW_ID, COL_ID_B, 1),
            viewColumn('vc-3', VIEW_ID, COL_ID_C, 2),
          ]),
        );
      columnServiceFindAll.mockResolvedValue(allowedCols);

      const dto: UpdateUserTableViewColumnsDto = {
        columns: [
          { column_id: COL_ID_A },
          { column_id: COL_ID_B },
          { column_id: COL_ID_C },
        ],
      };

      const result = await service.update_columns(VIEW_ID, dto);

      expect(result.columns).toHaveLength(3);
      expect(viewColumnRepoCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          view_id: VIEW_ID,
          column_id: COL_ID_B,
          order: 1,
          visible: true,
          width: 160,
          pinned: false,
        }),
      );
      expect(viewColumnRepoCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          view_id: VIEW_ID,
          column_id: COL_ID_C,
          order: 2,
          visible: true,
          width: 160,
          pinned: false,
        }),
      );
    });

    it('updates existing columns order, visible, width, pinned', async () => {
      const vcA = viewColumn('vc-a', VIEW_ID, COL_ID_A, 0, {
        visible: true,
        width: 160,
        pinned: false,
      });
      const vcB = viewColumn('vc-b', VIEW_ID, COL_ID_B, 1, {
        visible: true,
        width: 200,
        pinned: false,
      });
      const view = viewWithColumns([vcA, vcB]);
      const allowedCols = [tableColumn(COL_ID_A), tableColumn(COL_ID_B)];
      viewRepoFindOne.mockResolvedValueOnce(view).mockResolvedValueOnce(view);

      columnServiceFindAll.mockResolvedValue(allowedCols);

      await service.update_columns(VIEW_ID, {
        columns: [
          {
            column_id: COL_ID_B,
            order: 0,
            visible: false,
            width: 100,
            pinned: true,
          },
          { column_id: COL_ID_A, order: 1 },
        ],
      });

      expect(vcB.order).toBe(0);
      expect(vcB.visible).toBe(false);
      expect(vcB.width).toBe(100);
      expect(vcB.pinned).toBe(true);
      expect(vcA.order).toBe(1);
    });

    it('reorders by array index when order is omitted', async () => {
      const vcA = viewColumn('vc-a', VIEW_ID, COL_ID_A, 0);
      const vcB = viewColumn('vc-b', VIEW_ID, COL_ID_B, 1);
      const view = viewWithColumns([vcA, vcB]);
      columnServiceFindAll.mockResolvedValue([
        tableColumn(COL_ID_A),
        tableColumn(COL_ID_B),
      ]);
      viewRepoFindOne.mockResolvedValueOnce(view).mockResolvedValueOnce(view);

      await service.update_columns(VIEW_ID, {
        columns: [{ column_id: COL_ID_B }, { column_id: COL_ID_A }],
      });

      expect(vcB.order).toBe(0);
      expect(vcA.order).toBe(1);
    });

    it('soft-removes columns omitted from payload', async () => {
      const vcA = viewColumn('vc-a', VIEW_ID, COL_ID_A, 0);
      const vcB = viewColumn('vc-b', VIEW_ID, COL_ID_B, 1);
      const view = viewWithColumns([vcA, vcB]);
      columnServiceFindAll.mockResolvedValue([
        tableColumn(COL_ID_A),
        tableColumn(COL_ID_B),
      ]);
      viewRepoFindOne
        .mockResolvedValueOnce(view)
        .mockResolvedValueOnce(viewWithColumns([vcA]));

      await service.update_columns(VIEW_ID, {
        columns: [{ column_id: COL_ID_A }],
      });

      expect(managerSoftRemove).toHaveBeenCalledWith([vcB]);
    });

    it('returns updated view with columns after successful update', async () => {
      const vcA = viewColumn('vc-a', VIEW_ID, COL_ID_A, 0);
      const view = viewWithColumns([vcA]);
      const updatedView = viewWithColumns([
        viewColumn('vc-a', VIEW_ID, COL_ID_A, 0, { width: 200 }),
      ]);
      columnServiceFindAll.mockResolvedValue([tableColumn(COL_ID_A)]);
      viewRepoFindOne
        .mockResolvedValueOnce(view)
        .mockResolvedValueOnce(updatedView);

      const result = await service.update_columns(VIEW_ID, {
        columns: [{ column_id: COL_ID_A, width: 200 }],
      });

      expect(result).toBe(updatedView);
      expect(result.columns).toHaveLength(1);
      expect(result.columns[0].width).toBe(200);
    });
  });
});
