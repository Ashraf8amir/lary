import { Injectable } from '@nestjs/common';
import { DEFAULT_WIDGET_SETTINGS } from './constants/default-widget-settings.constant';
import { UpsertWidgetSettingsDto } from './dtos/upsert-widget-settings.dto';
import { PublicWidgetSettings } from './interfaces/public-widget-settings.interface';
import { WidgetSettingsRepository } from './repositories/widget-settings.repository';
import { WidgetSettings, WidgetSettingsDocument } from './schemas/widget-settings.schema';

@Injectable()
export class WidgetSettingsService {
  constructor(private readonly widgetSettingsRepository: WidgetSettingsRepository) {}

  async upsert(storeId: string, dto: UpsertWidgetSettingsDto): Promise<WidgetSettingsDocument> {
    return this.widgetSettingsRepository.upsert(storeId, dto);
  }

  async getPublicSettings(storeId: string): Promise<PublicWidgetSettings> {
    const settings = await this.widgetSettingsRepository.findByStoreId(storeId);
    return this.mapToPublicSettings(settings);
  }

  private mapToPublicSettings(
    settings: WidgetSettings | WidgetSettingsDocument | null,
  ): PublicWidgetSettings {
    if (!settings) {
      return { ...DEFAULT_WIDGET_SETTINGS };
    }

    return {
      primaryColor: settings.primaryColor ?? DEFAULT_WIDGET_SETTINGS.primaryColor,
      position: settings.position ?? DEFAULT_WIDGET_SETTINGS.position,
      welcomeMessage: settings.welcomeMessage ?? DEFAULT_WIDGET_SETTINGS.welcomeMessage,
      botName: settings.botName ?? DEFAULT_WIDGET_SETTINGS.botName,
      avatarUrl: settings.avatarUrl ?? null,
      isEnabled: settings.isEnabled ?? DEFAULT_WIDGET_SETTINGS.isEnabled,
    };
  }
}
