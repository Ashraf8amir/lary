import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { StorePlatform, StoreStatus } from '../enums/stores.enums';

export type StoreDocument = HydratedDocument<Store>;

@Schema({ _id: false, timestamps: false })
export class StoreSocial {
  @Prop({ type: String, trim: true })
  telegram?: string;

  @Prop({ type: String, trim: true })
  twitter?: string;

  @Prop({ type: String, trim: true })
  facebook?: string;

  @Prop({ type: String, trim: true })
  maroof?: string;

  @Prop({ type: String, trim: true })
  youtube?: string;

  @Prop({ type: String, trim: true })
  snapchat?: string;

  @Prop({ type: String, trim: true })
  whatsapp?: string;

  @Prop({ type: String, trim: true })
  instagram?: string;

  @Prop({ type: String, trim: true })
  appstoreLink?: string;

  @Prop({ type: String, trim: true })
  googleplayLink?: string;
}

export const StoreSocialSchema = SchemaFactory.createForClass(StoreSocial);

const transform = (_doc: unknown, ret: Record<string, unknown>) => {
  delete ret._id;
  return ret;
};

@Schema({
  timestamps: true,
  collection: 'stores',
  versionKey: false,
  toJSON: { virtuals: true, transform },
  toObject: { virtuals: true, transform },
})
export class Store {
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxLength: 200,
    minLength: 2,
  })
  name!: string;

  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: 'User',
    index: true,
  })
  ownerId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(StoreStatus),
    default: StoreStatus.Active,
    index: true,
  })
  status!: StoreStatus;

  @Prop({
    type: String,
    enum: Object.values(StorePlatform),
    required: true,
    default: StorePlatform.Salla,
  })
  platform!: StorePlatform;

  @Prop({
    type: String,
    required: false,
    trim: true,
    index: true,
  })
  merchantId?: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
  })
  plan?: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
    lowercase: true,
  })
  email?: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
  })
  description?: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
    uppercase: true,
    default: 'SAR',
  })
  currency!: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
  })
  domain?: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
  })
  avatar?: string;

  @Prop({
    type: StoreSocialSchema,
    required: false,
  })
  social?: StoreSocial;

  @Prop({ type: Date, required: false })
  onboardingCompletedAt?: Date;
}

export const StoreSchema = SchemaFactory.createForClass(Store);

StoreSchema.index({ platform: 1, merchantId: 1 }, { unique: true, sparse: true });
