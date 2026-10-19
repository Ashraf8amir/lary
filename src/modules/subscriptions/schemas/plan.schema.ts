import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { PlanFeature, PlanSlug } from '../enums/plan.enums';

export type PlanDocument = HydratedDocument<Plan>;

@Schema({ _id: false, timestamps: false })
export class PlanLimits {
  @Prop({ type: Number, required: true })
  messagesLimit!: number;

  @Prop({ type: Number, required: true })
  productsLimit!: number;

  @Prop({ type: Number, required: true })
  historyRetentionDays!: number;
}

export const PlanLimitsSchema = SchemaFactory.createForClass(PlanLimits);

@Schema({
  timestamps: true,
  collection: 'plans',
  versionKey: false,
})
export class Plan {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, enum: Object.values(PlanSlug), required: true, unique: true })
  slug!: PlanSlug;

  @Prop({ type: PlanLimitsSchema, required: true })
  limits!: PlanLimits;

  @Prop({ type: [String], enum: Object.values(PlanFeature), default: [] })
  features!: PlanFeature[];
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
