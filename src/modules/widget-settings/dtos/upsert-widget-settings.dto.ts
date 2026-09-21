import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
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
  @IsString()
  @MaxLength(300, { message: 'welcomeMessage must not exceed 300 characters' })
  @Transform(({ value }: { value?: string }) => (typeof value === 'string' ? value.trim() : value))
  welcomeMessage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value?: string }) => (typeof value === 'string' ? value.trim() : value))
  botName?: string;

  @IsOptional()
  @IsUrl({}, { message: 'avatarUrl must be a valid URL' })
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
