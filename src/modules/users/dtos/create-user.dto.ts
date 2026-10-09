import { Trim } from '@/common/decorators/trim.decorator';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserStatus } from '../enums/user-status.enum';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }: { value?: string }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @IsOptional()
  @MaxLength(100)
  @Trim()
  fullName?: string;

  @IsEnum(UserStatus, { message: 'Invalid user status' })
  @IsOptional()
  status?: UserStatus;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Trim()
  mobile?: string;
}
