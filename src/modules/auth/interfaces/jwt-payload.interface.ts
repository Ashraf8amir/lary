export interface BaseJwtPayload {
  sub: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export interface AccessTokenPayload extends BaseJwtPayload {
  sessionId: string;
}
