import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
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
    unique: true,
    trim: true,
  })
  sallaId!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxLength: 200,
  })
  name!: string;

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
