import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { StoreMemberRole } from '../enums/store-member-role.enum';

export type StoreMemberDocument = HydratedDocument<StoreMember>;

const transform = (_doc: unknown, ret: Record<string, unknown>) => {
  delete ret._id;
  return ret;
};

@Schema({
  timestamps: true,
  collection: 'store_members',
  versionKey: false,
  toJSON: { virtuals: true, transform },
  toObject: { virtuals: true, transform },
})
export class StoreMember {
  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: 'User',
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: 'Store',
    index: true,
  })
  storeId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(StoreMemberRole),
    default: StoreMemberRole.Owner,
  })
  role!: StoreMemberRole;

  @Prop({
    type: Date,
    default: () => new Date(),
  })
  joinedAt!: Date;
}

export const StoreMemberSchema = SchemaFactory.createForClass(StoreMember);

StoreMemberSchema.index({ userId: 1, storeId: 1 }, { unique: true, name: 'user_store_unique' });
