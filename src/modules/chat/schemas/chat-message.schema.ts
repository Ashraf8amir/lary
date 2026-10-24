import type { ProductCard } from '@modules/products/interfaces/product-card.interface';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

export const CHAT_MESSAGE_ROLES = ['user', 'assistant'] as const;
export type ChatMessageRole = (typeof CHAT_MESSAGE_ROLES)[number];

@Schema({ _id: false })
export class ChatProductCard {
  @Prop({ type: String, required: true })
  type!: string;

  @Prop({ type: String, required: false })
  originalExternalId?: string;

  @Prop({ type: String, required: true })
  variantId!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: Number, required: true })
  priceAmount!: number;

  @Prop({ type: Number, required: false })
  regularPriceAmount?: number;

  @Prop({ type: String, required: true })
  currency!: string;

  @Prop({ type: String, required: false })
  imageUrl?: string;

  @Prop({ type: String, required: false })
  productUrl?: string;

  @Prop({ type: String, required: false })
  optionsLabel?: string;

  @Prop({ type: String, required: false })
  promotionTitle?: string;

  @Prop({ type: Boolean, required: true })
  isAvailable!: boolean;
}

export const ChatProductCardSchema = SchemaFactory.createForClass(ChatProductCard);

@Schema({
  timestamps: true,
  collection: 'chat_messages',
  versionKey: false,
})
export class ChatMessage {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Store', index: true })
  storeId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  conversationId!: string;

  @Prop({ type: Number, required: true })
  sequence!: number;

  @Prop({ type: String, required: true, enum: CHAT_MESSAGE_ROLES })
  role!: ChatMessageRole;

  @Prop({ type: String, required: true })
  content!: string;

  @Prop({ type: [ChatProductCardSchema] })
  cards?: ProductCard[];

  @Prop({ type: Date })
  expiresAt?: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

ChatMessageSchema.index({ storeId: 1, conversationId: 1, sequence: 1 });

ChatMessageSchema.index({ storeId: 1, conversationId: 1, createdAt: 1 });

ChatMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
