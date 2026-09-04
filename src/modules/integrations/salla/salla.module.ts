import { AuthModule } from '@/modules/auth/auth.module';
import { StoresModule } from '@modules/stores/stores.module';
import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SallaApiClient } from './clients/salla-api.client';
import { SallaHttpClient } from './clients/salla-http.client';
import { SallaIntegrationRepository } from './repositories/salla-integration.repository';
import { SallaIntegrationController } from './salla-integration.controller';
import { SallaIntegrationService } from './salla-integration.service';
import { SallaIntegration, SallaIntegrationSchema } from './schemas/salla-integration.schema';
import { SallaSyncService } from './services/salla-sync.service';
import { SallaTokenService } from './services/salla-token.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SallaIntegration.name, schema: SallaIntegrationSchema }]),
    UsersModule,
    StoresModule,
    AuthModule,
  ],
  controllers: [SallaIntegrationController],
  providers: [
    SallaIntegrationRepository,
    SallaTokenService,
    SallaIntegrationService,
    SallaSyncService,
    SallaHttpClient,
    SallaApiClient,
  ],
  exports: [SallaIntegrationService, SallaTokenService],
})
export class SallaModule {}
