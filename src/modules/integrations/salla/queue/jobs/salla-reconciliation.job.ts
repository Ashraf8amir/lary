import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { SallaIntegrationStatus } from '../../enums/salla-integration-status.enum';
import { SallaIntegrationRepository } from '../../repositories/salla-integration.repository';
import { SallaSyncService } from '../../services/salla-sync.service';

@Injectable()
export class SallaReconciliationJob {
  private readonly logger = new Logger(SallaReconciliationJob.name);

  constructor(
    private readonly integrationRepository: SallaIntegrationRepository,
    private readonly sallaSyncService: SallaSyncService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runDailyReconciliation(): Promise<void> {
    this.logger.log('Starting daily Salla product reconciliation');

    const connectedIntegrations = await this.integrationRepository.findAllByStatus(
      SallaIntegrationStatus.Connected,
    );

    this.logger.log(`Queuing full sync for ${connectedIntegrations.length} connected store(s)`);

    for (const integration of connectedIntegrations) {
      await this.sallaSyncService.triggerFullSync(integration.storeId.toString());
    }
  }
}
