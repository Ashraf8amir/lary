import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ChatPersistenceRepository } from './repositories/chat-persistence.repository';
import { ChatConversation, ChatConversationSchema } from './schemas/chat-conversation.schema';
import { ChatMessage, ChatMessageSchema } from './schemas/chat-message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatConversation.name, schema: ChatConversationSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
  ],
  providers: [ChatPersistenceRepository],
  exports: [ChatPersistenceRepository],
})
export class ChatPersistenceModule {}

