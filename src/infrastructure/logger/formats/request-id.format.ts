import { ClsServiceManager } from 'nestjs-cls';
import * as winston from 'winston';

export const addRequestId = winston.format((info) => {
  const cls = ClsServiceManager.getClsService();
  const requestId = cls?.getId?.();
  if (requestId) {
    info.requestId = requestId;
  }
  return info;
});
