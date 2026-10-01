import { RabbitMqInfrastructureModule } from '@/infrastructure/rabbitmq/rabbitmq.module';
import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { WidgetSettingsModule } from '../widget-settings/widget-settings.module';
import { LLM_PROVIDER } from './chat.constants';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GeminiContentMapper } from './mapper/gemini-content.mapper';
import { SystemPromptBuilder } from './prompts/system-prompt.builder';
import { GeminiProvider } from './providers/gemini.provider';
import { ChatSummaryConsumer } from './queues/consumers/chat-summary.consumer';
import { ChatSummaryPublisher } from './queues/publishers/chat-summary.publisher';
import { ConversationSessionService } from './services/conversation-session.service';
import { ConversationSummaryService } from './services/conversation-summary.service';
import { ToolExecutorService } from './services/tool-executor.service';

@Module({
  imports: [WidgetSettingsModule, ProductsModule, RabbitMqInfrastructureModule],
  controllers: [ChatController],
  providers: [
    GeminiProvider,
    GeminiContentMapper,
    { provide: LLM_PROVIDER, useExisting: GeminiProvider },
    ChatService,
    ConversationSessionService,
    SystemPromptBuilder,
    ToolExecutorService,
    ConversationSummaryService,
    ChatSummaryPublisher,
    ChatSummaryConsumer,
  ],
  exports: [LLM_PROVIDER],
})
export class ChatModule {}
