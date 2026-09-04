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
  @Transform(({ value }: { value?: string }) => (typeof value === 'string' ? value.trim() : value))
  fullName?: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Transform(({ value }: { value?: string }) => (typeof value === 'string' ? value.trim() : value))
  mobile?: string;
}
