import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({
  timestamps: true,
  collection: 'subscriptions',
  versionKey: false,
})
export class Subscription {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Store', unique: true })
  storeId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Plan' })
  planId!: Types.ObjectId;

  @Prop({ type: String, index: { unique: true, sparse: true } })
  sallaSubscriptionId?: string;

  @Prop({
    type: String,
    enum: Object.values(SubscriptionStatus),
    default: SubscriptionStatus.TRIALING,
  })
  status!: SubscriptionStatus;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, required: true })
  endDate!: Date;

  @Prop({ type: Boolean, required: true, default: false })
  isTrial!: boolean;

  @Prop({ type: Date, required: true })
  lastEventAt!: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
