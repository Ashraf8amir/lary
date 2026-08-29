export default () => ({
  app: {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    appName: process.env.APP_NAME ?? 'Lary',
  },

  database: {
    uri: process.env.DATABASE_URI,
    retryAttempts: Number(process.env.DATABASE_RETRY_ATTEMPTS) || 5,
    retryDelay: Number(process.env.DATABASE_RETRY_DELAY) || 1000,
    maxPoolSize: Number(process.env.DATABASE_MAX_POOL_SIZE) || 10,
    minPoolSize: Number(process.env.DATABASE_MIN_POOL_SIZE) || 5,
    serverSelectionTimeoutMS: Number(process.env.DATABASE_SERVER_SELECTION_TIMEOUT_MS) || 5000,
  },
});
