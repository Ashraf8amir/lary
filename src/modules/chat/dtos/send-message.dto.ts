import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsUUID('4', { message: 'conversationId must be a valid UUID' })
  conversationId!: string;

  @IsMongoId({ message: 'storeId must be a valid ObjectId' })
  storeId!: string;

  @IsString({ message: 'message must be a string' })
  @IsNotEmpty({ message: 'message is required' })
  @MaxLength(1000, { message: 'message must not exceed 1000 characters' })
  @Transform(({ value }: { value?: unknown }) => {
    if (typeof value !== 'string') return value;

    return value
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/\[DISPLAY_CARDS:[^\]]*\]/gi, '')
      .trim();
  })
  message!: string;
}
