export interface SallaUserInfo {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  role?: string;
  created_at?: string;
}

export interface SallaMerchantInfo {
  id: number;
  username: string;
  name: string;
  avatar: string;
  store_location: string;
  plan: string;
  status: string;
  domain: string;
  created_at: string;
}

export interface SallaApiErrorResponse {
  status?: number;
  message?: string;
  errors?: Record<string, string[]>;
}
