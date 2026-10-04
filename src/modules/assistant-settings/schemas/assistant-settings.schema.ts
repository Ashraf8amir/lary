import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { DEFAULT_ASSISTANT_SETTINGS } from '../constants/default-assistant-settings.constant';
import { WidgetPosition } from '../enums/widget-position.enum';

export type AssistantSettingsDocument = HydratedDocument<AssistantSettings>;

@Schema({ _id: false })
export class SupportContact {
  @Prop({ type: String, default: null })
  whatsapp?: string | null;

  @Prop({ type: String, default: null })
  phone?: string | null;

  @Prop({ type: String, default: null })
  email?: string | null;
}
export const SupportContactSchema = SchemaFactory.createForClass(SupportContact);

@Schema({ _id: false })
export class StorePolicies {
  @Prop({ type: String, default: null })
  shippingPolicy?: string | null;

  @Prop({ type: String, default: null })
  returnPolicy?: string | null;

  @Prop({ type: String, default: null })
  paymentMethods?: string | null;

  @Prop({ type: String, default: null })
  aboutStore?: string | null;
}
export const StorePoliciesSchema = SchemaFactory.createForClass(StorePolicies);

@Schema({ _id: false })
export class StoreFaqItem {
  @Prop({ type: String, required: true, trim: true })
  question!: string;

  @Prop({ type: String, required: true, trim: true })
  answer!: string;
}
export const StoreFaqItemSchema = SchemaFactory.createForClass(StoreFaqItem);

@Schema({
  timestamps: true,
  collection: 'assistant_settings',
  versionKey: false,
})
export class AssistantSettings {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Store', unique: true })
  storeId!: Types.ObjectId;

  @Prop({ type: String, default: DEFAULT_ASSISTANT_SETTINGS.primaryColor })
  primaryColor!: string;

  @Prop({
    type: String,
    enum: Object.values(WidgetPosition),
    default: DEFAULT_ASSISTANT_SETTINGS.position,
  })
  position!: WidgetPosition;

  @Prop({ type: String, default: DEFAULT_ASSISTANT_SETTINGS.welcomeMessage })
  welcomeMessage!: string;

  @Prop({ type: String, default: DEFAULT_ASSISTANT_SETTINGS.botName })
  botName!: string;

  @Prop({ type: String, required: false, default: null })
  avatarUrl?: string | null;

  @Prop({ type: Boolean, default: DEFAULT_ASSISTANT_SETTINGS.isEnabled })
  isEnabled!: boolean;

  @Prop({
    type: SupportContactSchema,
    default: () => ({ ...DEFAULT_ASSISTANT_SETTINGS.supportContact }),
  })
  supportContact!: SupportContact;

  @Prop({
    type: StorePoliciesSchema,
    default: () => ({ ...DEFAULT_ASSISTANT_SETTINGS.storePolicies }),
  })
  storePolicies!: StorePolicies;

  @Prop({ type: [StoreFaqItemSchema], default: [] })
  faqs!: StoreFaqItem[];
}

export const AssistantSettingsSchema = SchemaFactory.createForClass(AssistantSettings);
