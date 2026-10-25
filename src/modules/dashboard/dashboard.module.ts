import { Module } from '@nestjs/common';

import { AssistantSettingsModule } from '@modules/assistant-settings/assistant-settings.module';
import { ChatPersistenceModule } from '@modules/chat/chat-persistence.module';
import { ProductsModule } from '@modules/products/products.module';
import { SallaModule } from '@modules/integrations/salla/salla.module';
import { StoresModule } from '@modules/stores/stores.module';
import { SubscriptionsModule } from '@modules/subscriptions/subscriptions.module';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    StoresModule,
    SubscriptionsModule,
    ProductsModule,
    AssistantSettingsModule,
    SallaModule,
    ChatPersistenceModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
