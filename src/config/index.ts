import appConfig from './app.config';
import chatConfig from './chat.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';
import sallaConfig from './salla.config';

export const allConfigs = [
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  sallaConfig,
  chatConfig,
];

export { appConfig, chatConfig, databaseConfig, jwtConfig, redisConfig, sallaConfig };
