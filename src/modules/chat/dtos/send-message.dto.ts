import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiPropertyOptional({
    description: 'The unique identifier of the conversation',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'conversationId is required' })
  @IsUUID('4', { message: 'conversationId must be a valid UUID' })
  conversationId!: string;

  @ApiPropertyOptional({
    description: 'The unique identifier of the store',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'storeId is required' })
  @IsMongoId({ message: 'storeId must be a valid ObjectId' })
  storeId!: string;

  @ApiPropertyOptional({
    description: 'The message content to be sent',
    example: 'Hello, I need assistance with my order.',
  })
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
