export interface SallaApiResponse<T> {
  status: number;
  success: boolean;
  data: T;
}

export interface SallaErrorBody {
  error?: string;
  error_description?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface SallaStoreInfo {
  id: number;
  name: string;
  entity?: string;
  email?: string;
  avatar?: string;
  plan?: string;
  type?: string;
  status?: string;
  verified?: boolean;
  currency?: string;
  domain?: string;
  description?: string;
  licenses?: Record<string, unknown>;
  social?: {
    telegram?: string;
    twitter?: string;
    facebook?: string;
    maroof?: string;
    youtube?: string;
    snapchat?: string;
    whatsapp?: string;
    instagram?: string;
    appstore_link?: string;
    googleplay_link?: string;
  };
}

export interface SallaUserMerchantSummary {
  id: number;
  username?: string;
  name?: string;
  avatar?: string;
  store_location?: string;
  plan?: string;
  status?: string;
  domain?: string;
  created_at?: string;
}

export interface SallaUserInfo {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  role?: string;
  created_at?: string;
  merchant?: SallaUserMerchantSummary;
  context?: {
    app: number;
    scope: string;
    exp: number;
  };
}
