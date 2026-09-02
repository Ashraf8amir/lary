import { randomUUID } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

import { UsersService } from '@/modules/users/users.service';

import { LoginDto } from './dtos/login.dto';
import { GenerateTokensResult } from './interfaces/auth-result.interface';
import { SessionContext } from './interfaces/session-context.interface';
import { AuthRepository } from './repositories/auth.repository';
import { ActiveSession } from './schemas/session.schema';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authRepository: AuthRepository,
    private readonly SessionService: SessionService,
    private readonly TokenService: TokenService,
  ) {}

  async login(dto: LoginDto, context: SessionContext): Promise<GenerateTokensResult> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const authDoc = await this.authRepository.findByUserId(user._id);

    if (!authDoc?.credentials?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, authDoc.credentials.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokensForNewSession(user._id, context);
  }

  async refreshTokens(rawRefreshToken: string): Promise<GenerateTokensResult> {
    const tokenHash = this.TokenService.hashToken(rawRefreshToken);
    const authDoc = await this.authRepository.findByRefreshTokenHash(tokenHash);

    if (!authDoc) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = authDoc.sessions.find((s) =>
      this.TokenService.compareToken(tokenHash, s.refreshTokenHash),
    );

    if (!session) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    if (session.expiresAt <= new Date()) {
      await this.authRepository.deleteSessionFamily(authDoc.userId, session.familyId);
      throw new UnauthorizedException(
        'Refresh token has expired and Security alert: Refresh token reuse detected. All sessions revoked.',
      );
    }

    const newRefreshToken = this.TokenService.generateRefreshToken();

    const isUpdated = await this.authRepository.updateSessionToken(
      authDoc.userId,
      session.sessionId,
      newRefreshToken.hash,
      newRefreshToken.expiresAt,
    );

    if (!isUpdated) {
      throw new UnauthorizedException('Failed to rotate session. Please login again.');
    }

    const user = await this.usersService.findById(authDoc.userId.toString());

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.TokenService.signAccessToken({
      userId: user._id.toString(),
      sessionId: session.sessionId,
    });

    return {
      accessToken: accessToken.token,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshTokenExpiresAt: newRefreshToken.expiresAt,
      rawRefreshToken: newRefreshToken.raw,
    };
  }

  private async issueTokensForNewSession(
    userId: Types.ObjectId,
    context: SessionContext,
  ): Promise<GenerateTokensResult> {
    if (context.deviceId) {
      await this.authRepository.deleteSessionByDeviceId(userId, context.deviceId);
    }

    const sessionId = randomUUID();
    const refreshToken = this.TokenService.generateRefreshToken();

    const session: ActiveSession = {
      sessionId,
      familyId: randomUUID(),
      refreshTokenHash: refreshToken.hash,
      deviceId: context.deviceId,
      deviceName: context.deviceName,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent ?? null,
      browser: context.browser ?? 'Unknown',
      os: context.os ?? 'Unknown',
      deviceType: context.deviceType ?? 'Unknown',
      isPrimary: context.isPrimary ?? false,
      expiresAt: refreshToken.expiresAt,
      createdAt: new Date(),
    };

    await this.SessionService.createSession(userId, session);

    const accessToken = this.TokenService.signAccessToken({
      userId: userId.toString(),
      sessionId,
    });

    return {
      accessToken: accessToken.token,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshTokenExpiresAt: refreshToken.expiresAt,
      rawRefreshToken: refreshToken.raw,
    };
  }
}
