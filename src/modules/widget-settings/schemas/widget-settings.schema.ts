import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { DEFAULT_WIDGET_SETTINGS } from '../constants/default-widget-settings.constant';
import { WidgetPosition } from '../enums/widget-position.enum';

export type WidgetSettingsDocument = HydratedDocument<WidgetSettings>;

@Schema({
  timestamps: true,
  collection: 'widget_settings',
  versionKey: false,
})
export class WidgetSettings {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Store', unique: true, index: true })
  storeId!: Types.ObjectId;

  @Prop({ type: String, default: DEFAULT_WIDGET_SETTINGS.primaryColor })
  primaryColor!: string;

  @Prop({
    type: String,
    enum: Object.values(WidgetPosition),
    default: DEFAULT_WIDGET_SETTINGS.position,
  })
  position!: WidgetPosition;

  @Prop({ type: String, default: DEFAULT_WIDGET_SETTINGS.welcomeMessage })
  welcomeMessage!: string;

  @Prop({ type: String, default: DEFAULT_WIDGET_SETTINGS.botName })
  botName!: string;

  @Prop({ type: String, required: false, default: null })
  avatarUrl?: string | null;

  @Prop({ type: Boolean, default: DEFAULT_WIDGET_SETTINGS.isEnabled })
  isEnabled!: boolean;
}

export const WidgetSettingsSchema = SchemaFactory.createForClass(WidgetSettings);
