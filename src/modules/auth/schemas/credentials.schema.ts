import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { AuthProvider } from '../enums/auth-provider.enum';

@Schema({ _id: false })
export class Credentials {
  @Prop({ type: String, enum: AuthProvider, default: AuthProvider.SALLA, index: true })
  provider!: AuthProvider;

  @Prop({ type: String, default: null, index: true })
  providerId!: string | null;

  @Prop({ type: String, select: false, default: null })
  passwordHash!: string | null;
}

export const CredentialsSchema = SchemaFactory.createForClass(Credentials);
