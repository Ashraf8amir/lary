export const LOGGER_CONSTANTS = {
  APP_NAME: process.env.APP_NAME || 'NestApp',
  SLACK: {
    STACK_TRACE_MAX_LENGTH: 600,
    CLIENT_ERROR_RANGE: { min: 400, max: 499 },
    COOLDOWN_MS: 60_000,
    CACHE_MAX_SIZE: 100,
  },
  FILE_ROTATION: {
    MAX_SIZE: '20m',
    ERROR_MAX_FILES: '30d',
    COMBINED_MAX_FILES: '14d',
  },
};
