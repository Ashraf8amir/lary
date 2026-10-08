import { Types } from 'mongoose';
import { StorePlatform, StoreStatus } from '../enums/stores.enums';

export interface StoreSocialLinks {
  telegram?: string;
  twitter?: string;
  facebook?: string;
  maroof?: string;
  youtube?: string;
  snapchat?: string;
  whatsapp?: string;
  instagram?: string;
  appstoreLink?: string;
  googleplayLink?: string;
}

export interface CreateStoreInput {
  name: string;
  ownerId: string;
  platform: StorePlatform;
  merchantId?: string;
  status?: StoreStatus;
  plan?: string;
  email?: string;
  description?: string;
  currency?: string;
  domain?: string;
  avatar?: string;
  social?: StoreSocialLinks;
}

export interface UpdateStoreInput {
  name?: string;
  status?: StoreStatus;
  plan?: string;
  email?: string;
  description?: string;
  currency?: string;
  domain?: string;
  avatar?: string;
  social?: StoreSocialLinks;
}

export interface StoreIdAndStatus {
  _id: Types.ObjectId;
  status: StoreStatus;
}
