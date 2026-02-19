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
import {
  ConfirmResetPasswordDto,
  confirmResetPasswordSchema,
} from '@repo/store';
import { CreateProfileDto, createProfileSchema, UserRole } from '@repo/store';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { StandardParam, StandardParams } from 'nest-standard-response';
import { formatUser } from './users.helper';

@Controller('users')
@UseGuards(BearerAuthGuard, RolesGuard, FieldRestrictionsGuard)
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly userProfileService: UserProfileService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async create(
    @StandardParam() params: StandardParams,
    @Body(ZodValidationPipe.create(createProfileSchema)) dto: CreateProfileDto,
  ) {
    const result = await this.userProfileService.createProfile(dto);
    params.setMessage('Profile created successfully');
    return result;
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR)
  async find_all() {
    const users = await this.userService.find_all(null, {
      order: { name: 'ASC' },
    });
    return users.map(formatUser);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR)
  async find_one(@Param('id') id: string) {
    return await this.userService.find_by_and_fail({ id });
  }

  /** Get user + integrated role profile (Doctor/Patient) for the "Update a User" form. */
  @Get(':id/profile')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MODERATOR,
    UserRole.DOCTOR,
    UserRole.PATIENT,
  )
  async get_profile(@Param('id') id: string) {
    return await this.userProfileService.getProfile(id);
  }

  /** Update both user (name, email, phone) and role-specific profile in one request. */
  @Patch(':id/profile')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MODERATOR,
    UserRole.DOCTOR,
    UserRole.PATIENT,
  )
  async update_profile(
    @StandardParam() params: StandardParams,
    @Param('id') id: string,
    @Body(ZodValidationPipe.create(createProfileSchema)) dto: CreateProfileDto,
  ) {
    const result = await this.userProfileService.updateProfile(id, dto);
    params.setMessage('Profile updated successfully');
    return result;
  }

  // reset password
  @Post(':id/reset-password')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async reset_password(
    @StandardParam() params: StandardParams,
    @Param('id') id: string,
    @Body(ZodValidationPipe.create(confirmResetPasswordSchema))
    dto: ConfirmResetPasswordDto,
  ) {
    await this.userService.update_password(id, dto.password);
    params.setMessage('Password reset successfully');
    return null;
  }
}
