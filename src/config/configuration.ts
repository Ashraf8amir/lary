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
});
