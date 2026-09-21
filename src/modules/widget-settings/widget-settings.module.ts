import { StoresModule } from '@modules/stores/stores.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WidgetSettingsRepository } from './repositories/widget-settings.repository';
import { WidgetSettings, WidgetSettingsSchema } from './schemas/widget-settings.schema';
import { WidgetSettingsController } from './widget-settings.controller';
import { WidgetSettingsService } from './widget-settings.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WidgetSettings.name, schema: WidgetSettingsSchema }]),
    StoresModule,
  ],
  controllers: [WidgetSettingsController],
  providers: [WidgetSettingsRepository, WidgetSettingsService],
  exports: [WidgetSettingsService],
})
export class WidgetSettingsModule {}
