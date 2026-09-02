import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserStatus } from '../enums/user-status.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  collection: 'users',
  versionKey: false,
})
export class User {
  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    maxLength: 254,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
  })
  email!: string;

  @Prop({
    type: String,
    required: false,
    default: '',
    trim: true,
    maxLength: 100,
  })
  fullName!: string;

  @Prop({
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.Active,
    index: true,
  })
  status!: UserStatus;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
