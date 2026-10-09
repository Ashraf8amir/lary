import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { WidgetPosition } from '../enums/widget-position.enum';

const trimTransform = ({ value }: { value?: string | null }) =>
  typeof value === 'string' ? value.trim() : value;

export class SupportContactDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(trimTransform)
  @IsString()
  @MaxLength(30)
  whatsapp?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(trimTransform)
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(trimTransform)
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(100)
  email?: string | null;
}

export class StorePoliciesDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(trimTransform)
  @IsString()
  @MaxLength(1000)
  shippingPolicy?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(trimTransform)
  @IsString()
  @MaxLength(1000)
  returnPolicy?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(trimTransform)
  @IsString()
  @MaxLength(500)
  paymentMethods?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(trimTransform)
  @IsString()
  @MaxLength(1000)
  aboutStore?: string | null;
}

export class StoreFaqItemDto {
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  question!: string;

  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(600)
  answer!: string;
}

export class UpsertAssistantSettingsDto {
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, {
    message: 'primaryColor must be a valid hex color',
  })
  primaryColor?: string;

  @IsOptional()
  @IsEnum(WidgetPosition)
  position?: WidgetPosition;

  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300, { message: 'welcomeMessage must not exceed 300 characters' })
  welcomeMessage?: string;

  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  botName?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUrl({}, { message: 'avatarUrl must be a valid URL' })
  avatarUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SupportContactDto)
  supportContact?: SupportContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StorePoliciesDto)
  storePolicies?: StorePoliciesDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15, { message: 'Maximum of 15 FAQs allowed' })
  @ValidateNested({ each: true })
  @Type(() => StoreFaqItemDto)
  faqs?: StoreFaqItemDto[];
}
