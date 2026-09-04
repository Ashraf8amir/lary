import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SallaAppAuthorizeDataDto {
  @IsString()
  @IsNotEmpty()
  access_token!: string;

  @IsString()
  @IsNotEmpty()
  refresh_token!: string;

  @IsNumber()
  @IsNotEmpty()
  expires!: number;

  @IsString()
  @IsOptional()
  scope?: string;

  @IsString()
  @IsOptional()
  token_type?: string;

  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  @IsOptional()
  app_name?: string;
}

export class SallaAppUninstalledDataDto {
  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class SallaWebhookPayloadDto {
  @IsString()
  @IsNotEmpty()
  event!: string;

  @IsNumber()
  @IsNotEmpty()
  merchant!: number;

  @IsString()
  @IsOptional()
  created_at?: string;

  @IsOptional()
  data?: Record<string, any>;
}
