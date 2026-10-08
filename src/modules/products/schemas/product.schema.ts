import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ProductStatus } from '../enums/product-status.enum';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false, timestamps: false })
export class ProductVariantOptionValue {
  @Prop({ type: String, required: true, trim: true })
  optionName!: string;

  @Prop({ type: String, required: true, trim: true })
  value!: string;
}

export const ProductVariantOptionValueSchema =
  SchemaFactory.createForClass(ProductVariantOptionValue);

@Schema({ _id: false, timestamps: false })
export class ProductVariant {
  @Prop({ type: String, required: true, trim: true })
  externalId!: string;

  @Prop({ type: String, required: false, trim: true })
  sku?: string;

  @Prop({ type: String, required: false, trim: true })
  barcode?: string;

  @Prop({ type: Number, required: true })
  priceAmount!: number;

  @Prop({ type: Number, required: false })
  regularPriceAmount?: number;

  @Prop({ type: Number, required: false })
  salePriceAmount?: number;

  @Prop({ type: String, required: true, trim: true })
  currency!: string;

  @Prop({ type: Number, required: true, default: 0 })
  stockQuantity!: number;

  @Prop({ type: Boolean, required: true, default: false })
  isUnlimitedStock!: boolean;

  @Prop({ type: String, required: false })
  imageUrl?: string;

  @Prop({ type: String, required: false, trim: true })
  weightLabel?: string;

  @Prop({
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.Available,
  })
  status!: ProductStatus;

  @Prop({ type: [ProductVariantOptionValueSchema], default: [] })
  optionValues!: ProductVariantOptionValue[];
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

@Schema({
  timestamps: true,
  collection: 'products',
  versionKey: false,
})
export class Product {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Store', index: true })
  storeId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  externalId!: string;

  @Prop({ type: String, required: true, index: true })
  platform!: string;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: false, trim: true })
  sku?: string;

  @Prop({ type: String, required: false })
  description?: string;

  @Prop({ type: String, required: false, index: true })
  category?: string;

  @Prop({ type: [String], default: [], index: true })
  categories!: string[];

  @Prop({ type: String, required: false, trim: true, index: true })
  brand?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: String, required: false })
  imageUrl?: string;

  @Prop({ type: String, required: false })
  productUrl?: string;

  @Prop({ type: Boolean, required: true, default: false })
  hasVariants!: boolean;

  @Prop({ type: Number, required: true })
  priceAmount!: number;

  @Prop({ type: Number, required: false })
  regularPriceAmount?: number;

  @Prop({ type: Number, required: false })
  salePriceAmount?: number;

  @Prop({ type: Date, required: false })
  saleEndAt?: Date;

  @Prop({ type: String, required: true, trim: true })
  currency!: string;

  @Prop({ type: Number, required: true, default: 0 })
  stockQuantity!: number;

  @Prop({ type: Boolean, required: true, default: false })
  isUnlimitedStock!: boolean;

  @Prop({ type: String, required: false, trim: true })
  promotionTitle?: string;

  @Prop({ type: String, required: false, trim: true })
  promotionSubtitle?: string;

  @Prop({ type: Number, required: false })
  ratingRate?: number;

  @Prop({ type: Number, required: false })
  ratingCount?: number;

  @Prop({ type: Number, required: false })
  calories?: number;

  @Prop({ type: String, required: false, trim: true })
  weightLabel?: string;

  @Prop({
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.Available,
    index: true,
  })
  status!: ProductStatus;

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants!: ProductVariant[];

  @Prop({ type: Date, required: true, default: () => new Date() })
  lastSyncedAt!: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ storeId: 1, platform: 1, externalId: 1 }, { unique: true });
ProductSchema.index({ storeId: 1, 'variants.externalId': 1 });
ProductSchema.index({ storeId: 1, status: 1, priceAmount: 1 });
