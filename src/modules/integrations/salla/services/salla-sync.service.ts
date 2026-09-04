import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SallaSyncService {
  private readonly logger = new Logger(SallaSyncService.name);

  async triggerSync(storeId: string, syncType: string): Promise<void> {
    this.logger.log(`Sync triggered for store ${storeId}, type: ${syncType}`);
  }
}
