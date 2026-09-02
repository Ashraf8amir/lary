import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AccessTokenPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.access.secret'),
    });
  }

  async validate(payload: AccessTokenPayload) {
    if (!payload.sub || !payload.sessionId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,
      sessionId: payload.sessionId,
      jti: payload.jti,
    };
  }
}
