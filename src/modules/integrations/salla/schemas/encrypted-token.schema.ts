import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false, timestamps: false })
export class EncryptedToken {
  @Prop({ type: String, required: true })
  encrypted!: string;

  @Prop({ type: String, required: true })
  iv!: string;

  @Prop({ type: String, required: true })
  authTag!: string;
}

export const EncryptedTokenSchema = SchemaFactory.createForClass(EncryptedToken);

@Schema({ _id: false, timestamps: false })
export class EncryptedAccessToken {
  @Prop({ type: String, required: true })
  encrypted!: string;

  @Prop({ type: String, required: true })
  iv!: string;

  @Prop({ type: String, required: true })
  authTag!: string;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;
}

export const EncryptedAccessTokenSchema = SchemaFactory.createForClass(EncryptedAccessToken);
