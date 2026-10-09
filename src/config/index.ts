import appConfig from './app.config';
import chatConfig from './chat.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import meilisearchConfig from './meilisearch.config';
import redisConfig from './redis.config';
import sallaConfig from './salla.config';

export const allConfigs = [
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  sallaConfig,
  chatConfig,
  meilisearchConfig,
];

export {
  appConfig,
  chatConfig,
  databaseConfig,
  jwtConfig,
  meilisearchConfig,
  redisConfig,
  sallaConfig,
};
