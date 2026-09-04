import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { StorePlan } from '../enums/store-plan.enum';
import { StoreStatus } from '../enums/store-status.enum';

export type StoreDocument = HydratedDocument<Store>;

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
  })
  name!: string;

  // Set once at creation time (whoever installs/registers the store).
  // Intentionally omitted from UpdateStoreDto — ownership transfer should
  // be its own explicit, audited operation, never a side effect of a
  // generic PATCH.
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
    required: true,
    trim: true,
  })
  platform!: string;

  @Prop({
    type: String,
    enum: Object.values(StorePlan),
    default: StorePlan.Free,
    index: true,
  })
  planType!: StorePlan;
}

export const StoreSchema = SchemaFactory.createForClass(Store);
