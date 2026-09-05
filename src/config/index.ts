import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';
import sallaConfig from './salla.config';

export const allConfigs = [appConfig, databaseConfig, jwtConfig, redisConfig, sallaConfig];

export { appConfig, databaseConfig, jwtConfig, redisConfig, sallaConfig };
