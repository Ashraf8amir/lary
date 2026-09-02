export interface SessionContext {
  deviceId: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string | null;
  browser?: string;
  os?: string;
  deviceType?: string;
  isPrimary?: boolean;
}
