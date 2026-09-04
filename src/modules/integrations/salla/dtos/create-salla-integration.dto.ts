import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SallaIntegrationStatus } from '../enums/salla-integration-status.enum';

export class EncryptedTokenDto {
  @IsString()
  @IsNotEmpty()
  encrypted!: string;

  @IsString()
  @IsNotEmpty()
  iv!: string;

  @IsString()
  @IsNotEmpty()
  authTag!: string;

  @IsOptional()
  expiresAt?: Date;
}

export class CreateSallaIntegrationDto {
  @IsMongoId({ message: 'storeId must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'storeId is required' })
  storeId!: string;

  @IsString()
  @IsNotEmpty({ message: 'sallaStoreId is required' })
  @Transform(({ value }: { value?: unknown }) =>
    value !== undefined && value !== null ? String(value).trim() : value,
  )
  sallaStoreId!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EncryptedTokenDto)
  accessToken?: EncryptedTokenDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EncryptedTokenDto)
  refreshToken?: EncryptedTokenDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @IsOptional()
  @IsEnum(SallaIntegrationStatus)
  status?: SallaIntegrationStatus;

  @IsOptional()
  @IsString()
  merchantEmail?: string;

  @IsOptional()
  @IsString()
  merchantMobile?: string;
}
