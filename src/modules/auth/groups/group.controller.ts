import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StandardParam, StandardParams } from 'nest-standard-response';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { BearerAuthGuard } from '../guards/bearer-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('auth/groups')
@UseGuards(BearerAuthGuard, RolesGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async create(
    @StandardParam() params: StandardParams,
    @Body() dto: CreateGroupDto,
  ) {
    const group = await this.groupService.create(dto);
    params.setMessage('Group created successfully');
    return group;
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR)
  async findAll() {
    return await this.groupService.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR)
  async findOne(@Param('id') id: string) {
    return await this.groupService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async update(
    @StandardParam() params: StandardParams,
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    const group = await this.groupService.update(id, dto);
    params.setMessage('Group updated successfully');
    return group;
  }

  @Delete(':id/soft-remove')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async softRemove(
    @StandardParam() params: StandardParams,
    @Param('id') id: string,
  ) {
    await this.groupService.softRemove(id);
    params.setMessage('Group removed successfully');
    return null;
  }
}
