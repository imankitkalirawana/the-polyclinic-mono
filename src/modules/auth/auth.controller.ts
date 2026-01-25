import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { StandardParam, StandardParams } from 'nest-standard-response';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { IssueTenantTokenDto } from './dto/issue-tenant-token.dto';
import { BearerAuthGuard } from './guards/bearer-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @Post('register')
  async register(
    @StandardParam() params: StandardParams,
    @Body() dto: RegisterDto,
  ) {
    const result = await this.authService.register(dto);
    params.setMessage('User registered successfully');
    return result;
  }

  /**
   * Issue a tenant token (schema switcher lives in tenant strategy).
   * Requires a global token.
   */
  @Post('tenant-token')
  @UseGuards(BearerAuthGuard)
  async issueTenantToken(
    @StandardParam() params: StandardParams,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: IssueTenantTokenDto,
  ) {
    if (user.type !== 'global') {
      // Defensive: BearerAuthGuard should only allow global token.
      throw new UnauthorizedException('Invalid token type for tenant-token');
    }

    const token = await this.authService.issueTenantToken(user.userId, dto);
    params.setMessage('Tenant token issued successfully');
    return token;
  }

  @Get('me')
  @UseGuards(BearerAuthGuard)
  async me(@CurrentUser() user: CurrentUserPayload) {
    return await this.authService.getMe(user.userId);
  }

  @Delete('logout')
  @UseGuards(BearerAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: CurrentUserPayload) {
    await this.authService.logout(user.sessionId, user.userId);
    return null;
  }
}
