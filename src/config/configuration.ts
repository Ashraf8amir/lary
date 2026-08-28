export default () => ({
  app: {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    appName: process.env.APP_NAME ?? 'Lary',
  },
});
