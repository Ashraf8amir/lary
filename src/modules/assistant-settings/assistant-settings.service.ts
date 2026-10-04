import { CacheService } from '@infrastructure/cache/cache.service';
import { Injectable } from '@nestjs/common';
import {
  ASSISTANT_SETTINGS_CACHE_PREFIX,
  ASSISTANT_SETTINGS_CACHE_TTL_SECONDS,
  DEFAULT_ASSISTANT_SETTINGS,
} from './constants/default-assistant-settings.constant';
import { UpsertAssistantSettingsDto } from './dtos/upsert-assistant-settings.dto';
import {
  FullAssistantSettings,
  PublicAssistantSettings,
  StorePoliciesForChat,
  SupportContactData,
  SystemPromptAssistantSettings,
} from './interfaces/assistant-settings.interface';
import { AssistantSettingsRepository } from './repositories/assistant-settings.repository';
import { AssistantSettings, AssistantSettingsDocument } from './schemas/assistant-settings.schema';

@Injectable()
export class AssistantSettingsService {
  constructor(
    private readonly assistantSettingsRepository: AssistantSettingsRepository,
    private readonly cacheService: CacheService,
  ) {}

  async upsert(storeId: string, dto: UpsertAssistantSettingsDto): Promise<FullAssistantSettings> {
    const updatedDoc = await this.assistantSettingsRepository.upsert(storeId, dto);
    const fullSettings = this.mapToFullSettings(updatedDoc);

    await this.cacheService.set(
      this.buildCacheKey(storeId),
      fullSettings,
      ASSISTANT_SETTINGS_CACHE_TTL_SECONDS,
    );

    return fullSettings;
  }

  async getSettingsForDashboard(storeId: string): Promise<FullAssistantSettings> {
    return this.getCachedOrFetch(storeId);
  }

  async getPublicSettings(storeId: string): Promise<PublicAssistantSettings> {
    const full = await this.getCachedOrFetch(storeId);

    return {
      primaryColor: full.primaryColor,
      position: full.position,
      welcomeMessage: full.welcomeMessage,
      botName: full.botName,
      avatarUrl: full.avatarUrl,
      isEnabled: full.isEnabled,
      supportContact: full.supportContact,
    };
  }

  async getForSystemPrompt(storeId: string): Promise<SystemPromptAssistantSettings> {
    const full = await this.getCachedOrFetch(storeId);

    return {
      isEnabled: full.isEnabled,
      botName: full.botName,
      supportContactInfo: this.formatSupportContact(full.supportContact),
    };
  }

  async getPoliciesForChat(storeId: string): Promise<StorePoliciesForChat> {
    const full = await this.getCachedOrFetch(storeId);

    return {
      supportContact: full.supportContact,
      storePolicies: full.storePolicies,
      faqs: full.faqs,
    };
  }

  private async getCachedOrFetch(storeId: string): Promise<FullAssistantSettings> {
    const cacheKey = this.buildCacheKey(storeId);
    const cached = await this.cacheService.get<FullAssistantSettings>(cacheKey);

    if (cached) {
      return cached;
    }

    const dbSettings = await this.assistantSettingsRepository.findByStoreId(storeId);
    const fullSettings = this.mapToFullSettings(dbSettings);

    await this.cacheService.set(cacheKey, fullSettings, ASSISTANT_SETTINGS_CACHE_TTL_SECONDS);

    return fullSettings;
  }

  private mapToFullSettings(
    settings: AssistantSettings | AssistantSettingsDocument | null,
  ): FullAssistantSettings {
    if (!settings) {
      return structuredClone(DEFAULT_ASSISTANT_SETTINGS);
    }

    return {
      primaryColor: settings.primaryColor ?? DEFAULT_ASSISTANT_SETTINGS.primaryColor,
      position: settings.position ?? DEFAULT_ASSISTANT_SETTINGS.position,
      welcomeMessage: settings.welcomeMessage ?? DEFAULT_ASSISTANT_SETTINGS.welcomeMessage,
      botName: settings.botName ?? DEFAULT_ASSISTANT_SETTINGS.botName,
      avatarUrl: settings.avatarUrl ?? null,
      isEnabled: settings.isEnabled ?? DEFAULT_ASSISTANT_SETTINGS.isEnabled,
      supportContact: {
        whatsapp: settings.supportContact?.whatsapp ?? null,
        phone: settings.supportContact?.phone ?? null,
        email: settings.supportContact?.email ?? null,
      },
      storePolicies: {
        shippingPolicy: settings.storePolicies?.shippingPolicy ?? null,
        returnPolicy: settings.storePolicies?.returnPolicy ?? null,
        paymentMethods: settings.storePolicies?.paymentMethods ?? null,
        aboutStore: settings.storePolicies?.aboutStore ?? null,
      },
      faqs: (settings.faqs ?? []).map((faq) => ({
        question: faq.question,
        answer: faq.answer,
      })),
    };
  }

  private formatSupportContact(contact: SupportContactData): string | null {
    const parts: string[] = [];

    if (contact.whatsapp) parts.push(`واتساب: ${contact.whatsapp}`);
    if (contact.phone) parts.push(`هاتف: ${contact.phone}`);
    if (contact.email) parts.push(`بريد إلكتروني: ${contact.email}`);

    return parts.length > 0 ? parts.join(' | ') : null;
  }

  private buildCacheKey(storeId: string): string {
    return `${ASSISTANT_SETTINGS_CACHE_PREFIX}${storeId}`;
  }
}
