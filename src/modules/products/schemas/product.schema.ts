import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ProductStatus } from '../enums/product-status.enum';

export type ProductDocument = HydratedDocument<Product>;

@Schema({
  timestamps: true,
  collection: 'products',
  versionKey: false,
})
export class Product {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Store', index: true })
  storeId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  externalId!: string;

  @Prop({ type: String, required: true, index: true })
  platform!: string;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: false })
  description?: string;

  @Prop({ type: String, required: false, index: true })
  category?: string;

  @Prop({ type: String, required: false })
  imageUrl?: string;

  @Prop({ type: String, required: false })
  productUrl?: string;

  @Prop({ type: Boolean, required: true, default: false })
  hasVariants!: boolean;

  @Prop({ type: Number, required: true })
  priceAmount!: number;

  @Prop({ type: String, required: true })
  currency!: string;

  @Prop({ type: Number, required: true, default: 0 })
  stockQuantity!: number;

  @Prop({ type: Boolean, required: true, default: false })
  isUnlimitedStock!: boolean;

  @Prop({
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.Available,
    index: true,
  })
  status!: ProductStatus;

  @Prop({ type: Date, required: true, default: () => new Date() })
  lastSyncedAt!: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ storeId: 1, platform: 1, externalId: 1 }, { unique: true });

ProductSchema.index({ storeId: 1, status: 1, name: 'text' });
