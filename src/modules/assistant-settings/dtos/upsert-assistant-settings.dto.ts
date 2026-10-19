import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({ description: 'WhatsApp contact number' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(trimTransform)
  @IsString()
  @MaxLength(30)
  whatsapp?: string | null;

  @ApiPropertyOptional({ description: 'Phone contact number' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(trimTransform)
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional({ description: 'Email contact address' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(trimTransform)
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(100)
  email?: string | null;
}

export class StorePoliciesDto {
  @ApiPropertyOptional({ description: 'Shipping policy of the store' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(trimTransform)
  @IsString()
  @MaxLength(1000)
  shippingPolicy?: string | null;

  @ApiPropertyOptional({ description: 'Return policy of the store' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(trimTransform)
  @IsString()
  @MaxLength(1000)
  returnPolicy?: string | null;

  @ApiPropertyOptional({ description: 'Payment methods accepted by the store' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(trimTransform)
  @IsString()
  @MaxLength(500)
  paymentMethods?: string | null;

  @ApiPropertyOptional({ description: 'About the store' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(trimTransform)
  @IsString()
  @MaxLength(1000)
  aboutStore?: string | null;
}

export class StoreFaqItemDto {
  @ApiPropertyOptional({ description: 'FAQ question' })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  question!: string;

  @ApiPropertyOptional({ description: 'FAQ answer' })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(600)
  answer!: string;
}

export class UpsertAssistantSettingsDto {
  @ApiPropertyOptional({
    description: 'Primary color in hex format (e.g., #FF5733)',
    example: '#FF5733',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, {
    message: 'primaryColor must be a valid hex color',
  })
  primaryColor?: string;

  @ApiPropertyOptional({
    description: 'Position of the widget on the page',
    enum: WidgetPosition,
    example: WidgetPosition.BottomRight,
  })
  @IsOptional()
  @IsEnum(WidgetPosition)
  position?: WidgetPosition;

  @ApiPropertyOptional({
    description: 'Welcome message displayed in the assistant widget',
    example: 'Hello, I am your virtual assistant!',
  })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300, { message: 'welcomeMessage must not exceed 300 characters' })
  welcomeMessage?: string;

  @ApiPropertyOptional({
    description: 'Name of the assistant bot',
    example: 'LaryBot',
  })
  @IsOptional()
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  botName?: string;

  @ApiPropertyOptional({
    description: 'URL of the avatar image for the assistant bot',
    example: 'https://example.com/avatar.png',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUrl({}, { message: 'avatarUrl must be a valid URL' })
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Indicates whether the assistant is enabled or disabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Support contact information for the store',
    type: SupportContactDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SupportContactDto)
  supportContact?: SupportContactDto;

  @ApiPropertyOptional({
    description: 'Store policies',
    type: StorePoliciesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StorePoliciesDto)
  storePolicies?: StorePoliciesDto;

  @ApiPropertyOptional({
    description: 'Frequently Asked Questions (FAQs) for the store',
    type: [StoreFaqItemDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15, { message: 'Maximum of 15 FAQs allowed' })
  @ValidateNested({ each: true })
  @Type(() => StoreFaqItemDto)
  faqs?: StoreFaqItemDto[];

  @ApiPropertyOptional({
    description: 'Custom persona or tone for the assistant bot',
    example: 'Friendly and professional',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(trimTransform)
  @IsString()
  @MaxLength(300, { message: 'customPersona must not exceed 300 characters' })
  customPersona?: string | null;
}
