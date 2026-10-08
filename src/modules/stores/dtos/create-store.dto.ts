import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';
import { StorePlatform, StoreStatus } from '../enums/stores.enums';

export class StoreSocialDto {
  @IsOptional()
  @Trim()
  @IsString()
  telegram?: string;

  @IsOptional()
  @Trim()
  @IsString()
  twitter?: string;

  @IsOptional()
  @Trim()
  @IsString()
  facebook?: string;

  @IsOptional()
  @Trim()
  @IsString()
  maroof?: string;

  @IsOptional()
  @Trim()
  @IsString()
  youtube?: string;

  @IsOptional()
  @Trim()
  @IsString()
  snapchat?: string;

  @IsOptional()
  @Trim()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @Trim()
  @IsString()
  instagram?: string;

  @IsOptional()
  @Trim()
  @IsString()
  appstoreLink?: string;

  @IsOptional()
  @Trim()
  @IsString()
  googleplayLink?: string;
}

export class CreateStoreDto {
  @IsOptional()
  @Trim()
  @IsString()
  merchantId?: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Store name is required' })
  @MinLength(2, { message: 'Store name must be at least 2 characters long' })
  @MaxLength(200, { message: 'Store name cannot exceed 200 characters' })
  name!: string;

  @IsMongoId({ message: 'Owner ID must be a valid ObjectId' })
  @IsNotEmpty({ message: 'Owner ID is required' })
  ownerId!: string;

  @Trim()
  @IsEnum(StorePlatform, {
    message: `Platform must be a valid platform: ${Object.values(StorePlatform).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Platform is required' })
  platform!: StorePlatform;

  @IsEnum(StoreStatus, {
    message: `Status must be a valid status: ${Object.values(StoreStatus).join(', ')}`,
  })
  @IsOptional()
  status?: StoreStatus;

  @IsOptional()
  @Trim()
  @IsString()
  plan?: string;

  @IsOptional()
  @Trim()
  @IsEmail({}, { message: 'Store email must be a valid email' })
  email?: string;

  @IsOptional()
  @Trim()
  @IsString()
  description?: string;

  @IsOptional()
  @Trim()
  @IsString()
  currency?: string;

  @IsOptional()
  @Trim()
  @IsString()
  domain?: string;

  @Trim()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  @IsOptional()
  avatar?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StoreSocialDto)
  social?: StoreSocialDto;
}
