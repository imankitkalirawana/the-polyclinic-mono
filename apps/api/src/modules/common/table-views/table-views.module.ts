import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableColumn } from './entities/column.entity';
import { UserTableView } from './entities/table-view.entity';
import { UserTableViewColumn } from './entities/table-view-column.entity';
import { ColumnService } from './column.service';
import { TableViewService } from './table-view.service';
import { TableViewController } from './table-view.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TableColumn, UserTableView, UserTableViewColumn]),
  ],
  controllers: [TableViewController],
  providers: [ColumnService, TableViewService],
  exports: [TableViewService, ColumnService],
})
export class TableViewsModule {}
