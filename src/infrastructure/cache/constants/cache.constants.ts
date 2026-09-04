export const CACHE_KEYS = {
  USER_PROFILE: (id: string) => `cache:user:${id}:profile`,
  STORE_DETAILS: (id: string) => `cache:store:${id}:details`,
  STORE_MEMBERS: (storeId: string) => `cache:store:${storeId}:members`,

  AUTH_ACCESS_BLACKLIST: (jti: string) => `auth:blacklist:access:${jti}`,
  AUTH_FAILED_ATTEMPTS: (identifier: string) => `auth:failed_attempts:${identifier}`,
  AUTH_LOCKOUT: (identifier: string) => `auth:lockout:${identifier}`,

  OAUTH_STATE: (state: string) => `salla:oauth:state:${state}`,
  TOKEN_LOCK: (integrationId: string) => `salla:token:lock:${integrationId}`,
} as const;

export const CACHE_TTL = {
  SHORT: 60 * 5,
  MEDIUM: 60 * 15,
  HOUR: 60 * 60,
  DAY: 60 * 60 * 24,

  FAILED_LOGIN_WINDOW: 60 * 15,
  ACCOUNT_LOCK: 60 * 15,
  TWO_FACTOR_TEMP: 60 * 10,

  OAUTH_STATE: 600,
  TOKEN_LOCK: 30,
} as const;
