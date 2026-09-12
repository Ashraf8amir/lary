import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum MessageProcessingStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export type MessageIdempotencyDocument = HydratedDocument<MessageIdempotency>;

@Schema({
  collection: 'processed_messages',
  timestamps: true,
})
export class MessageIdempotency {
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  messageId!: string;

  @Prop({
    required: true,
  })
  event!: string;

  @Prop({
    required: true,
    enum: MessageProcessingStatus,
  })
  status!: MessageProcessingStatus;

  @Prop({
    required: true,
  })
  startedAt!: Date;

  @Prop()
  completedAt?: Date;
}

export const MessageIdempotencySchema = SchemaFactory.createForClass(MessageIdempotency);

MessageIdempotencySchema.index({ status: 1, startedAt: 1 });
