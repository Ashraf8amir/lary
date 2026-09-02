import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { AccessTokenPayload } from '../interfaces/jwt-payload.interface';

export interface AccessTokenResult {
  token: string;
  jti: string;
  expiresAt: Date;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signAccessToken(params: { userId: string; sessionId: string }): AccessTokenResult {
    const jti = randomUUID();

    const expiresInSeconds = this.parseExpiresIn(
      this.configService.getOrThrow<string>('jwt.access.expiration'),
    );

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const payload: AccessTokenPayload = {
      sub: params.userId,
      sessionId: params.sessionId,
      jti,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwt.access.secret'),
      expiresIn: this.configService.getOrThrow<string>('jwt.access.expiration'),
    } as any);

    return {
      token,
      jti,
      expiresAt,
    };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('jwt.access.secret'),
      });

      if (!payload.sub) {
        throw new UnauthorizedException('Invalid access token');
      }

      if (!payload.jti) {
        throw new UnauthorizedException('Invalid access token');
      }

      if (!payload.sessionId) {
        throw new UnauthorizedException('Invalid access token');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  generateRefreshToken(): { raw: string; hash: string; expiresAt: Date } {
    const raw = randomBytes(64).toString('base64url');

    const hash = this.hashToken(raw);
    const refreshExpiresInSeconds = this.parseExpiresIn(
      this.configService.getOrThrow<string>('jwt.refresh.expiration'),
    );

    const expiresAt = new Date(Date.now() + refreshExpiresInSeconds * 1000);

    return {
      raw,
      hash,
      expiresAt,
    };
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }

  compareToken(incomingTokenHash: string, storedTokenHash: string): boolean {
    const incomingHash = Buffer.from(incomingTokenHash, 'hex');
    const storedHash = Buffer.from(storedTokenHash, 'hex');

    if (incomingHash.length !== storedHash.length) {
      return false;
    }

    return timingSafeEqual(incomingHash, storedHash);
  }

  private parseExpiresIn(expiresIn: string | number): number {
    if (typeof expiresIn === 'number') {
      return expiresIn;
    }

    const match = expiresIn.match(/^(\d+)\s*(s|m|h|d)$/);

    if (!match) {
      throw new Error(`Invalid JWT expiration format: ${expiresIn}`);
    }

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;

      case 'm':
        return value * 60;

      case 'h':
        return value * 60 * 60;

      case 'd':
        return value * 24 * 60 * 60;

      default:
        throw new Error(`Unsupported JWT expiration unit: ${unit}`);
    }
  }

  async issueAuthTokens(params: { userId: string; sessionId: string }) {
    const accessToken = this.signAccessToken(params);
    const refreshToken = this.generateRefreshToken();

    return {
      accessToken: accessToken.token,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshToken: refreshToken.raw,
      refreshTokenHash: refreshToken.hash,
      refreshTokenExpiresAt: refreshToken.expiresAt,
    };
  }
}
