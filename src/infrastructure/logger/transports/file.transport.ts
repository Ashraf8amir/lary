import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { LOGGER_CONSTANTS } from '../constants/logger.constants';
import { addRequestId } from '../formats/request-id.format';

const baseFormat = winston.format.combine(
  addRequestId(),
  winston.format.timestamp(),
  winston.format.json(),
);

const { MAX_SIZE, ERROR_MAX_FILES, COMBINED_MAX_FILES } = LOGGER_CONSTANTS.FILE_ROTATION;

export const createFileTransports = () => [
  new winston.transports.DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: MAX_SIZE,
    maxFiles: ERROR_MAX_FILES,
    zippedArchive: true,
    format: baseFormat,
  }),
  new winston.transports.DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: MAX_SIZE,
    maxFiles: COMBINED_MAX_FILES,
    zippedArchive: true,
    format: baseFormat,
  }),
];
