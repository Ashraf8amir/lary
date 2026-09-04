import { Transform } from 'class-transformer';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { StorePlan } from '../enums/store-plan.enum';
import { StoreStatus } from '../enums/store-status.enum';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty({ message: 'Store name is required' })
  @MaxLength(200)
  @Transform(({ value }: { value?: string }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsMongoId({ message: 'Owner ID must be a valid ObjectId' })
  @IsNotEmpty({ message: 'Owner ID is required' })
  ownerId!: string;

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
