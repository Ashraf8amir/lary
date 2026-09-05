export interface SallaIntrospectData {
  merchant_id: number;
  user_id: number;
  exp: string;
}

export interface SallaIntrospectResponse {
  status: number;
  success: boolean;
  data: SallaIntrospectData;
}
