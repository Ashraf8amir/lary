import { IsNotEmpty, IsString } from 'class-validator';

export class EmbeddedSessionDto {
  @IsString()
  @IsNotEmpty({ message: 'token is required' })
  token!: string;
}
