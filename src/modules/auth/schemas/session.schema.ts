import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class ActiveSession {
  @Prop({ required: true, index: true })
  sessionId!: string;

  @Prop({ required: true, select: false })
  refreshTokenHash!: string;

  @Prop({ required: true, index: true })
  familyId!: string;

  @Prop({ required: true })
  deviceId!: string;

  @Prop({ trim: true })
  deviceName?: string;

  @Prop({ trim: true })
  ipAddress?: string;

  @Prop({ type: String, default: null })
  userAgent!: string | null;

  @Prop({ default: 'Unknown' })
  browser!: string;

  @Prop({ default: 'Unknown' })
  os!: string;

  @Prop({ default: 'Unknown' })
  deviceType!: string;

  @Prop({ default: false })
  isPrimary!: boolean;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: Date.now })
  createdAt!: Date;
}

export const ActiveSessionSchema = SchemaFactory.createForClass(ActiveSession);
