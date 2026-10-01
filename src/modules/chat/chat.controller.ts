import { ResponseMessage } from '@common';
import { Public } from '@modules/auth/decorators/public.decorator';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dtos/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Public()
  @Post('message')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Message processed')
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.handleMessage(dto.conversationId, dto.storeId, dto.message);
  }
}
