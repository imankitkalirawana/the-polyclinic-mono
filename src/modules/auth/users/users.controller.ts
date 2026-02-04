import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './users.service';
import { UserProfileService } from './user-profile.service';
import { BearerAuthGuard } from '../guards/bearer-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { FieldRestrictionsGuard } from '../guards/field-restrictions.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { StandardParam, StandardParams } from 'nest-standard-response';
import { ResetPasswordDto } from '../dto/reset-password-dto';

@Controller('users')
@UseGuards(BearerAuthGuard, RolesGuard, FieldRestrictionsGuard)
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly userProfileService: UserProfileService,
  ) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async create(
    @StandardParam() params: StandardParams,
    @Body() dto: CreateProfileDto,
  ) {
    const result = await this.userProfileService.createProfile(dto);
    params.setMessage('Profile created successfully');
    return result;
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR)
  async find_all() {
    return await this.userService.find_all({}, { order: { name: 'ASC' } });
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR)
  async find_one(@Param('id') id: string) {
    return await this.userService.find_by_and_fail({ id });
  }

  /** Get user + integrated role profile (Doctor/Patient) for the "Update a User" form. */
  @Get(':id/profile')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.MODERATOR,
    Role.DOCTOR,
    Role.PATIENT,
  )
  async get_profile(@Param('id') id: string) {
    return await this.userProfileService.getProfile(id);
  }

  /** Update both user (name, email, phone) and role-specific profile in one request. */
  @Patch(':id/profile')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.MODERATOR,
    Role.DOCTOR,
    Role.PATIENT,
  )
  async updateProfile(
    @StandardParam() params: StandardParams,
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    console.log('dto in users.controller.ts', dto);
    const result = await this.userProfileService.updateProfile(id, dto);
    params.setMessage('Profile updated successfully');
    return result;
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async update(
    @StandardParam() params: StandardParams,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.userService.update(id, dto);
    params.setMessage('User updated successfully');
    return user;
  }

  // reset password
  @Post(':id/reset-password')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async resetPassword(
    @StandardParam() params: StandardParams,
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    await this.userService.updatePassword(id, dto.password);
    params.setMessage('Password reset successfully');
    return null;
  }
}
