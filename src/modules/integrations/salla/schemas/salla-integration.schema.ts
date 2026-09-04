import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SallaIntegrationStatus } from '../enums/salla-integration-status.enum';
import {
  EncryptedAccessToken,
  EncryptedAccessTokenSchema,
  EncryptedToken,
  EncryptedTokenSchema,
} from './encrypted-token.schema';

export type SallaIntegrationDocument = HydratedDocument<SallaIntegration>;

const transform = (_doc: unknown, ret: Record<string, unknown>) => {
  delete ret._id;
  delete ret.accessToken;
  delete ret.refreshToken;
  delete ret.isDeleted;
  delete ret.deletedAt;
  return ret;
};

@Schema({
  timestamps: true,
  collection: 'salla_integrations',
  versionKey: false,
  toJSON: { virtuals: true, transform },
  toObject: { virtuals: true, transform },
})
export class SallaIntegration {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Store' })
  storeId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  sallaStoreId!: string;

  @Prop({ type: EncryptedAccessTokenSchema, required: false })
  accessToken?: EncryptedAccessToken;

  @Prop({ type: EncryptedTokenSchema, required: false })
  refreshToken?: EncryptedToken;

  @Prop({ type: [String], default: [] })
  scopes!: string[];

  @Prop({
    type: String,
    enum: Object.values(SallaIntegrationStatus),
    default: SallaIntegrationStatus.Pending,
    index: true,
  })
  status!: SallaIntegrationStatus;

  @Prop({ type: String, required: false, trim: true, lowercase: true })
  merchantEmail?: string;

  @Prop({ type: String, required: false, trim: true })
  merchantMobile?: string;

  @Prop({ type: Date, required: false })
  connectedAt?: Date;

  @Prop({ type: Date, required: false })
  lastRefreshedAt?: Date;

  @Prop({ type: Date, required: false })
  lastSyncAt?: Date;

  @Prop({ type: Date, required: false })
  disconnectedAt?: Date;

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted!: boolean;

  @Prop({ type: Date, required: false })
  deletedAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const SallaIntegrationSchema = SchemaFactory.createForClass(SallaIntegration);

SallaIntegrationSchema.index(
  { storeId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: { $ne: true } } },
);

SallaIntegrationSchema.index(
  { sallaStoreId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: { $ne: true } } },
);

SallaIntegrationSchema.index({ status: 1, 'accessToken.expiresAt': 1 });
