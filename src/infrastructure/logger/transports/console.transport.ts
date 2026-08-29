import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import { LOGGER_CONSTANTS } from '../constants/logger.constants';
import { addRequestId } from '../formats/request-id.format';

export const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    addRequestId(),
    winston.format.timestamp(),
    nestWinstonModuleUtilities.format.nestLike(LOGGER_CONSTANTS.APP_NAME, {
      colors: true,
      prettyPrint: true,
      processId: false,
    }),
  ),
});
