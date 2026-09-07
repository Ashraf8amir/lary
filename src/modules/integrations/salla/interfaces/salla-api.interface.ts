export interface SallaStoreInfo {
  id: number;
  username: string;
  name: string;
  avatar: string;
  store_location: string;
  plan: string;
  status: string;
  created_at: string;
}

export interface SallaUserInfo {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: string;
  created_at: string;
  merchant: SallaStoreInfo;
}

export interface SallaApiResponse<T> {
  status: number;
  success: boolean;
  data: T;
}
