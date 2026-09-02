import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { Credentials, CredentialsSchema } from './credentials.schema';
import { ActiveSession, ActiveSessionSchema } from './session.schema';

export type AuthDocument = HydratedDocument<Auth>;

@Schema({
  timestamps: true,
  collection: 'auth_credentials',
  versionKey: false,
})
export class Auth {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ type: CredentialsSchema, required: true, default: () => ({}) })
  credentials!: Credentials;

  @Prop({ type: [ActiveSessionSchema], default: [] })
  sessions!: ActiveSession[];
}

export const AuthSchema = SchemaFactory.createForClass(Auth);
