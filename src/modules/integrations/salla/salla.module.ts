import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RabbitMqInfrastructureModule } from '@/infrastructure/rabbitmq/rabbitmq.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ProductsModule } from '@/modules/products/products.module';
import { StoresModule } from '@modules/stores/stores.module';
import { UsersModule } from '@modules/users/users.module';

import { SallaApiClient } from './clients/salla-api.client';
import { SallaEmbeddedClient } from './clients/salla-embedded.client';
import { SallaHttpClient } from './clients/salla-http.client';
import { SallaProductSyncConsumer } from './queue/consumers/salla-product-sync.consumer';
import { SallaReconciliationJob } from './queue/jobs/salla-reconciliation.job';
import { SallaProductSyncPublisher } from './queue/publishers/salla-product-sync.publisher';
import { SallaIntegrationRepository } from './repositories/salla-integration.repository';
import { SallaIntegrationController } from './salla-integration.controller';
import { SallaIntegrationService } from './salla-integration.service';
import { SallaIntegration, SallaIntegrationSchema } from './schemas/salla-integration.schema';
import { SallaEmbeddedAuthService } from './services/salla-embedded-auth.service';
import { SallaSyncService } from './services/salla-sync.service';
import { SallaTokenService } from './services/salla-token.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SallaIntegration.name, schema: SallaIntegrationSchema }]),
    UsersModule,
    StoresModule,
    AuthModule,
    RabbitMqInfrastructureModule,
    ProductsModule,
  ],
  controllers: [SallaIntegrationController],
  providers: [
    SallaIntegrationRepository,
    SallaTokenService,
    SallaIntegrationService,
    SallaSyncService,
    SallaHttpClient,
    SallaApiClient,
    SallaEmbeddedClient,
    SallaEmbeddedAuthService,
    SallaProductSyncPublisher,
    SallaProductSyncConsumer,
    SallaReconciliationJob,
  ],
  exports: [SallaIntegrationService, SallaTokenService],
})
export class SallaModule {}
