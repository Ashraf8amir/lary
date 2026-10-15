import { ApiErr } from '@/common/decorators/swagger/api-err.decorator';
import { ApiRes } from '@/common/decorators/swagger/api-res.decorator';
import { ResponseMessage } from '@common';
import { Public } from '@modules/auth/decorators/public.decorator';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { ChatResponseDto } from './dtos/chat-response.dto';
import { SendMessageDto } from './dtos/send-message.dto';

@ApiTags('Chat')
@ApiErr(['INTERNAL_SERVER_ERROR'])
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Public()
  @Post('message')
  @Throttle({
    short: { limit: 2, ttl: 5000 },
    long: { limit: 8, ttl: 60000 },
  })
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Message processed')
  @ApiOperation({
    summary: 'Send a message in the chat',
    description: 'Sends a message to a specific conversation in the chat.',
  })
  @ApiRes(ChatResponseDto, {
    status: HttpStatus.OK,
    description: 'Message processed successfully',
  })
  @ApiErr(['BAD_REQUEST', 'FORBIDDEN'])
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.handleMessage(dto.conversationId, dto.storeId, dto.message);
  }
}
