import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ColumnService } from './column.service';
import { ColumnDataType, TableColumn } from './entities/column.entity';
import { Like } from 'typeorm';

const mockRepository = {
  find: jest.fn().mockResolvedValue([]),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
};

describe('ColumnService', () => {
  let columnService: ColumnService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ColumnService,
        {
          provide: getRepositoryToken(TableColumn),
          useValue: mockRepository,
        },
      ],
    }).compile();
    columnService = moduleRef.get(ColumnService);
  });

  it('should return columns by table key', async () => {
    const mockColumns: Partial<TableColumn>[] = [
      {
        key: 'queue.aid',
        name: 'AID',
        data_type: ColumnDataType.STRING,
        is_sortable: true,
      },
      {
        key: 'queue.patientId',
        name: 'Patient ID',
        data_type: ColumnDataType.STRING,
        is_sortable: true,
      },
      {
        key: 'queue.doctorId',
        name: 'Doctor ID',
        data_type: ColumnDataType.STRING,
        is_sortable: true,
      },
      {
        key: 'queue.status',
        name: 'Status',
        data_type: ColumnDataType.STRING,
        is_sortable: true,
      },
    ];
    mockRepository.find.mockResolvedValue(mockColumns);
    const columns = await columnService.find_by({ key: Like('queue.%') });
    expect(columns).toHaveLength(4);
    expect(mockRepository.find).toHaveBeenCalledWith({
      where: { key: Like('queue.%') },
    });
  });
});
