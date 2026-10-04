import { WidgetPosition } from '../enums/widget-position.enum';
import { FullAssistantSettings } from '../interfaces/assistant-settings.interface';

export const ASSISTANT_SETTINGS_CACHE_PREFIX = 'assistant:settings:';
export const ASSISTANT_SETTINGS_CACHE_TTL_SECONDS = 3600;

export const DEFAULT_ASSISTANT_SETTINGS: FullAssistantSettings = {
  primaryColor: '#1f9991',
  position: WidgetPosition.BottomRight,
  welcomeMessage: 'أهلاً! تقدر تسألني عن أي منتج في المتجر',
  botName: 'مساعد المتجر',
  avatarUrl: null,
  isEnabled: true,
  supportContact: {
    whatsapp: null,
    phone: null,
    email: null,
  },
  storePolicies: {
    shippingPolicy: null,
    returnPolicy: null,
    paymentMethods: null,
    aboutStore: null,
  },
  faqs: [],
};
