import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { StorePlan } from '../enums/store-plan.enum';
import { StoreStatus } from '../enums/store-status.enum';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty({ message: 'Salla ID is required' })
  @Transform(({ value }: { value?: unknown }) =>
    value !== undefined && value !== null ? String(value).trim() : value,
  )
  sallaId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Store name is required' })
  @MaxLength(200)
  @Transform(({ value }: { value?: string }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Platform is required' })
  @Transform(({ value }: { value?: string }) => (typeof value === 'string' ? value.trim() : value))
  platform!: string;

  @IsEnum(StoreStatus)
  @IsOptional()
  status?: StoreStatus;

  @IsEnum(StorePlan)
  @IsOptional()
  planType?: StorePlan;
}
