import { WidgetPosition } from '../enums/widget-position.enum';

export interface SupportContactData {
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
}

export interface StorePoliciesData {
  shippingPolicy: string | null;
  returnPolicy: string | null;
  paymentMethods: string | null;
  aboutStore: string | null;
}

export interface StoreFaqData {
  question: string;
  answer: string;
}

export interface BaseAssistantSettings {
  primaryColor: string;
  position: WidgetPosition;
  welcomeMessage: string;
  botName: string;
  avatarUrl: string | null;
  isEnabled: boolean;
  supportContact: SupportContactData;
}

export interface PublicAssistantSettings extends BaseAssistantSettings {
  storeId: string;
}

export interface FullAssistantSettings extends BaseAssistantSettings {
  storePolicies: StorePoliciesData;
  faqs: StoreFaqData[];
}

export interface SystemPromptAssistantSettings {
  isEnabled: boolean;
  botName: string;
  supportContactInfo: string | null;
}

export interface StorePoliciesForChat {
  supportContact: SupportContactData;
  storePolicies: StorePoliciesData;
  faqs: StoreFaqData[];
}
