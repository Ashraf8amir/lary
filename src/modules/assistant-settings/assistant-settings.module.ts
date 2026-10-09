import { CacheModule } from '@infrastructure/cache/cache.module';
import { StoresModule } from '@modules/stores/stores.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssistantSettingsController } from './assistant-settings.controller';
import { AssistantSettingsService } from './assistant-settings.service';
import { AssistantSettingsRepository } from './repositories/assistant-settings.repository';
import { AssistantSettings, AssistantSettingsSchema } from './schemas/assistant-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AssistantSettings.name, schema: AssistantSettingsSchema }]),
    StoresModule,
    CacheModule,
  ],
  controllers: [AssistantSettingsController],
  providers: [AssistantSettingsRepository, AssistantSettingsService],
  exports: [AssistantSettingsService],
})
export class AssistantSettingsModule {}
