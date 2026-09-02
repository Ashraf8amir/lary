import { Transform } from 'class-transformer';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { StoreMemberRole } from '../enums/store-member-role.enum';

export class CreateStoreMemberDto {
  @IsMongoId({ message: 'User ID must be a valid ObjectId' })
  @IsNotEmpty({ message: 'User ID is required' })
  @Transform(({ value }: { value?: string }) => (typeof value === 'string' ? value.trim() : value))
  userId!: string;

  @IsMongoId({ message: 'Store ID must be a valid ObjectId' })
  @IsNotEmpty({ message: 'Store ID is required' })
  @Transform(({ value }: { value?: string }) => (typeof value === 'string' ? value.trim() : value))
  storeId!: string;

  @IsEnum(StoreMemberRole)
  @IsOptional()
  role?: StoreMemberRole;
}
