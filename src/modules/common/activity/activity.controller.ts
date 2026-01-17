import { Controller, Get, Query } from '@nestjs/common';
import { ActivityLogService } from './services/activity-log.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get('logs')
  async getActivityLogs(@Query('type') type: string, @Query('id') id: string) {
    return this.activityLogService.getActivityLogsByEntity(type, id);
  }
}
