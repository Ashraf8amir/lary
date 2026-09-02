import { Environment, ResponseMessage } from '@common';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { Types } from 'mongoose';
import { createHash } from 'node:crypto';
import { UAParser } from 'ua-parser-js';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenGuard } from './guards/refresh.token.guard';
import { GenerateTokensResult } from './interfaces/auth-result.interface';
import { SessionContext } from './interfaces/session-context.interface';

const REFRESH_COOKIE_NAME = 'refreshToken';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User login successful')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const sessionContext = this.extractSessionContext(req);

    const result = await this.authService.login(dto, sessionContext);

    return this.respondWithTokens(result, res);
  }

  @Public()
  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Token refresh successful')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { refreshToken } = req.user as { refreshToken: string };

    const result = await this.authService.refreshTokens(refreshToken);

    return this.respondWithTokens(result, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: { userId: string; sessionId: string; jti?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(new Types.ObjectId(user.userId), user.sessionId);
    this.clearRefreshCookie(res);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @CurrentUser('userId') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(new Types.ObjectId(userId));
    this.clearRefreshCookie(res);
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Active sessions retrieved successfully')
  async getSessions(@CurrentUser() user: { userId: string; sessionId: string }) {
    const sessions = await this.authService.getActiveSessions(
      new Types.ObjectId(user.userId),
      user.sessionId,
    );

    return sessions;
  }

  private extractSessionContext(req: Request): SessionContext {
    const userAgent = req.get('user-agent') ?? '';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip;

    const FallbackDeviceId = createHash('sha256')
      .update(`${userAgent}-${result.browser.name}-${result.os.name}-${result.device.type}`)
      .digest('hex');

    return {
      deviceId: (req.get('x-device-id') as string) || FallbackDeviceId,
      deviceName: (req.get('x-device-name') as string) ?? 'Unknown Device',
      ipAddress: clientIp,
      userAgent: userAgent,
      browser: result.browser.name ?? 'Unknown',
      os: result.os.name ?? 'Unknown',
      deviceType: result.device.type ?? 'desktop',
      isPrimary: req.get('x-is-primary') === 'true',
    };
  }

  private getRefreshCookieOptions(): CookieOptions {
    const isProduction = this.configService.get<string>('NODE_ENV') === Environment.Production;
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: cookieDomain || undefined,
      path: '/api/v1/auth',
    };
  }

  private setRefreshCookie(res: Response, token: string, expiresAt?: Date): void {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      ...this.getRefreshCookieOptions(),
      expires: expiresAt,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, this.getRefreshCookieOptions());
  }

  private respondWithTokens(payload: GenerateTokensResult, res: Response): AuthResponseDto {
    if (payload.rawRefreshToken) {
      this.setRefreshCookie(res, payload.rawRefreshToken, payload.refreshTokenExpiresAt);
    }

    return {
      accessToken: payload.accessToken,
      accessTokenExpiresAt: payload.accessTokenExpiresAt,
    };
  }
}
