import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UsageDocument = HydratedDocument<Usage>;

@Schema({
  timestamps: true,
  collection: 'usages',
  versionKey: false,
})
export class Usage {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Store', index: true })
  storeId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Subscription' })
  subscriptionId!: Types.ObjectId;

  @Prop({ type: Date, required: true })
  periodStart!: Date;

  @Prop({ type: Date, required: true })
  periodEnd!: Date;

  @Prop({ type: Number, required: true, default: 0 })
  aiMessagesCount!: number;

  @Prop({ type: Number, required: true, default: 0 })
  tokensUsed!: number;
}

export const UsageSchema = SchemaFactory.createForClass(Usage);

UsageSchema.index(
  { storeId: 1, subscriptionId: 1, periodStart: 1, periodEnd: 1 },
  { unique: true },
);
