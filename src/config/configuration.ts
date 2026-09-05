export default () => ({
  app: {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    appName: process.env.APP_NAME ?? 'Lary',
  },

  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
  },

  database: {
    uri: process.env.DATABASE_URI,
    retryAttempts: Number(process.env.DATABASE_RETRY_ATTEMPTS) || 5,
    retryDelay: Number(process.env.DATABASE_RETRY_DELAY) || 1000,
    maxPoolSize: Number(process.env.DATABASE_MAX_POOL_SIZE) || 10,
    minPoolSize: Number(process.env.DATABASE_MIN_POOL_SIZE) || 5,
    serverSelectionTimeoutMS: Number(process.env.DATABASE_SERVER_SELECTION_TIMEOUT_MS) || 5000,
  },

  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET,
      expiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    },

    refresh: {
      secret: process.env.JWT_REFRESH_SECRET,
      expiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
    db: Number(process.env.DATABASE_REDIS_DB) || 0,
  },

  salla: {
    clientId: process.env.SALLA_CLIENT_ID,
    clientSecret: process.env.SALLA_CLIENT_SECRET,
    baseUrl: process.env.SALLA_BASE_URL || 'https://api.salla.dev/admin/v2',
    oauthUrl: process.env.SALLA_OAUTH_URL || 'https://accounts.salla.sa',
    tokenRefreshWindowSeconds: Number(process.env.SALLA_TOKEN_REFRESH_WINDOW) || 86400,
    encryptionKey: process.env.SALLA_ENCRYPTION_KEY,
    webhookSecret: process.env.SALLA_WEBHOOK_SECRET,
    appId: process.env.SALLA_APP_ID,
    embeddedApiUrl: process.env.SALLA_EMBEDDED_API_URL || 'https://api.salla.dev',
  },
});
