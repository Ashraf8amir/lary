import { jwtConfig } from '@/config';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';

export interface JwtPayload {
  sub: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokenResult {
  accessToken: string;
  expiresAt: Date;
}

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
  ) {}

  async generateAccessToken(storeId: string): Promise<AuthTokenResult> {
    const jti = randomUUID();
    const { secret, expiration } = this.config.access;

    const payload: JwtPayload = {
      sub: storeId,
      jti,
    };

    const expiresInSeconds = this.parseExpirationToSeconds(expiration);

    const signOptions: JwtSignOptions = {
      secret,
      expiresIn: expiresInSeconds,
    };

    const token = this.jwtService.sign(payload, signOptions);

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    return {
      accessToken: token,
      expiresAt,
    };
  }

  private parseExpirationToSeconds(expiresIn: string | number): number {
    if (typeof expiresIn === 'number') {
      return expiresIn;
    }

    const match = expiresIn.match(/^(\d+)\s*(s|m|h|d)$/);

    if (!match) {
      throw new InternalServerErrorException(
        `Invalid JWT expiration format in config: ${expiresIn}`,
      );
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const timeMultipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };

    return value * timeMultipliers[unit];
  }
}
