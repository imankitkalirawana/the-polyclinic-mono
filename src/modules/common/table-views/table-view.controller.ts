import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TableViewService } from './table-view.service';
import { Request } from 'express';
import { UpdateUserTableViewColumnsDto } from './dto/update-user-table-view-columns.dto';
import { TableViewType } from './enums/table-view-type.enum';
import { BearerAuthGuard } from '@/auth/guards/bearer-auth.guard';
import { formatColumns, formatTableViewColumns } from './table-view.helper';
import { StandardParam, StandardParams } from 'nest-standard-response';

@Controller('table-views')
@UseGuards(BearerAuthGuard)
export class TableViewController {
  constructor(private readonly tableViewService: TableViewService) {}

  @Get()
  async find_all(@Req() request: Request) {
    return await this.tableViewService.find_all({
      user_id: request.user.userId,
    });
  }

  // get logged-in user's view (with selected columns) for a given view type
  @Get('columns/selected')
  async get_logged_user_view(
    @Req() request: Request,
    @Query('view_type') view_type: TableViewType,
  ) {
    const view = await this.tableViewService.get_user_view_with_columns(
      request.user.userId,
      view_type,
    );
    return formatTableViewColumns(view);
  }

  //   get all columns (view_type: COMMON)
  @Get('columns')
  async get_all_columns(@Query('view_type') view_type: TableViewType) {
    const columns = await this.tableViewService.get_all_columns(view_type);
    return formatColumns(columns);
  }

  //   update columns
  @Patch('columns')
  async update_columns(
    @Req() request: Request,
    @Query('view_type') view_type: TableViewType,
    @StandardParam() params: StandardParams,
    @Body() body: UpdateUserTableViewColumnsDto,
  ) {
    const defaultView = await this.tableViewService.get_user_view_with_columns(
      request.user.userId,
      view_type,
    );
    const updatedView = await this.tableViewService.update_columns(
      defaultView.id,
      body,
    );
    params.setMessage('Columns updated successfully');
    return updatedView;
  }
}
