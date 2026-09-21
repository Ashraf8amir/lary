import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ProductStatus } from '../enums/product-status.enum';

export type ProductVariantDocument = HydratedDocument<ProductVariant>;

@Schema({ _id: false })
export class ProductVariantOptionValue {
  @Prop({ type: String, required: true })
  optionName!: string;

  @Prop({ type: String, required: true })
  value!: string;
}

export const ProductVariantOptionValueSchema =
  SchemaFactory.createForClass(ProductVariantOptionValue);

@Schema({
  timestamps: true,
  collection: 'product_variants',
  versionKey: false,
})
export class ProductVariant {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Product', index: true })
  productId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Store', index: true })
  storeId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  externalId!: string;

  @Prop({ type: String, required: true, index: true })
  platform!: string;

  @Prop({ type: String, required: false })
  sku?: string;

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

  @Prop({ type: [ProductVariantOptionValueSchema], default: [] })
  optionValues!: ProductVariantOptionValue[];

  @Prop({ type: Date, required: true, default: () => new Date() })
  lastSyncedAt!: Date;
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

ProductVariantSchema.index({ productId: 1, platform: 1, externalId: 1 }, { unique: true });

ProductVariantSchema.index({ storeId: 1, productId: 1 });
