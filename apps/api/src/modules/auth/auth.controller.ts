import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StandardParam, StandardParams } from 'nest-standard-response';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ConfirmResetPasswordDto } from './dto/confirm-reset-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { BearerAuthGuard } from './guards/bearer-auth.guard';
import { SendOtpDto, sendOtpSchema } from '@repo/store';
import { VerifyOtpDto } from './users/dto/verify-otp.dto';
import { VerifyTokenDto } from './users/dto/verify-token.dto';
import { VerificationService } from './verification.service';
import { VerificationType } from '@repo/store';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
  ) {}

  @Post('check-email')
  async checkEmail(@Body() { email }: { email: string }) {
    return await this.authService.checkEmail(email);
  }

  @UseGuards(ThrottlerGuard)
  @Post('send-otp')
  async sendOtp(
    @StandardParam() params: StandardParams,
    @Body(ZodValidationPipe.create(sendOtpSchema)) dto: SendOtpDto,
  ) {
    await this.verificationService.sendOtp(dto.email, dto.type);
    params.setMessage('OTP sent successfully');
    return null;
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @StandardParam() params: StandardParams,
    @Body() dto: VerifyOtpDto,
  ) {
    await this.verificationService.verifyOtp({
      email: dto.email,
      otp: dto.otp,
      type: dto.type,
    });
    params.setMessage('OTP verified successfully');
    return {
      verified: true,
    };
  }

  @Post('verify-token')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Body() dto: VerifyTokenDto) {
    await this.verificationService.verifyToken(dto.email, dto.token, dto.type);
    return { verified: true };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @Post('google')
  async googleLogin(@Body() dto: GoogleAuthDto) {
    return await this.authService.googleLogin(dto);
  }

  @Post('register')
  async register(
    @StandardParam() params: StandardParams,
    @Body() dto: RegisterDto,
  ) {
    await this.verificationService.reverifyOtp(
      dto.email,
      dto.otp,
      VerificationType.REGISTRATION,
    );
    const result = await this.authService.register(dto);
    params.setMessage('User registered successfully');
    return result;
  }

  @Post('reset-password')
  async resetPassword(
    @StandardParam() params: StandardParams,
    @Body() dto: ConfirmResetPasswordDto,
  ) {
    await this.verificationService.reverifyOtp(
      dto.email,
      dto.otp,
      VerificationType.PASSWORD_RESET,
    );
    const result = await this.authService.resetPassword(dto);
    params.setMessage('Password reset successfully');
    return result;
  }

  @Get('session')
  @UseGuards(BearerAuthGuard)
  async session() {
    return await this.authService.getSession();
  }

  // get all sessions for the current user
  @Get('sessions')
  @UseGuards(BearerAuthGuard)
  async sessions() {
    return await this.authService.getSessions();
  }

  @Delete('logout')
  @UseGuards(BearerAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout() {
    await this.authService.logout();
    return null;
  }

  // logout all sessions for the current user
  @Delete('sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BearerAuthGuard)
  async logoutAllSessions() {
    await this.authService.logoutAllSessions();
    return null;
  }
}
