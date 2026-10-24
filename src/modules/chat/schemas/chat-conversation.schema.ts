import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatConversationDocument = HydratedDocument<ChatConversation>;

const TITLE_MAX_LENGTH = 100;

@Schema({
  timestamps: true,
  collection: 'chat_conversations',
  versionKey: false,
})
export class ChatConversation {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Store', index: true })
  storeId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  conversationId!: string;

  @Prop({ type: String, required: false, trim: true, maxLength: TITLE_MAX_LENGTH })
  title?: string;

  @Prop({ type: Number, required: true, default: 0 })
  messageCount!: number;

  @Prop({ type: Date, required: true })
  lastMessageAt!: Date;

  @Prop({ type: Date })
  expiresAt?: Date;
}

export const ChatConversationSchema = SchemaFactory.createForClass(ChatConversation);

ChatConversationSchema.index({ storeId: 1, conversationId: 1 }, { unique: true });

ChatConversationSchema.index({ storeId: 1, lastMessageAt: -1 });

ChatConversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const buildConversationTitle = (firstUserMessage: string): string =>
  firstUserMessage.trim().replace(/\s+/g, ' ').slice(0, TITLE_MAX_LENGTH);
