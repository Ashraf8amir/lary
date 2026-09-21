import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { WidgetPosition } from '../enums/widget-position.enum';

export class UpsertWidgetSettingsDto {
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
  @Transform(({ value }: { value?: string }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(300, { message: 'welcomeMessage must not exceed 300 characters' })
  welcomeMessage?: string;

  @IsOptional()
  @Transform(({ value }: { value?: string }) => (typeof value === 'string' ? value.trim() : value))
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
}
