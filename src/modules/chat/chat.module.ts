import { Module } from '@nestjs/common';

import { RabbitMqInfrastructureModule } from '@/infrastructure/rabbitmq/rabbitmq.module';

import { ProductsModule } from '../products/products.module';
import { WidgetSettingsModule } from '../widget-settings/widget-settings.module';

import { LLM_PROVIDER, SUMMARY_PROVIDER } from './chat.constants';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GeminiContentMapper } from './mapper/gemini-content.mapper';
import { SystemPromptBuilder } from './prompts/system-prompt.builder';
import { GeminiSummaryProvider } from './providers/gemini-summary.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { ChatSummaryConsumer } from './queues/consumers/chat-summary.consumer';
import { ChatSummaryPublisher } from './queues/publishers/chat-summary.publisher';
import { ChatGenerationService } from './services/chat-generation.service';
import { ChatResponseBuilder } from './services/chat-response.builder';
import { ConversationContext } from './services/conversation-context.service';
import { ConversationStore } from './services/conversation-store';
import { ConversationSummarizer } from './services/conversation-summarizer';
import { ToolExecutor } from './services/tool-executor';

@Module({
  imports: [WidgetSettingsModule, ProductsModule, RabbitMqInfrastructureModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGenerationService,
    ChatResponseBuilder,
    ConversationStore,
    ConversationContext,
    ConversationSummarizer,
    ToolExecutor,
    SystemPromptBuilder,
    GeminiContentMapper,

    GeminiProvider,
    {
      provide: LLM_PROVIDER,
      useExisting: GeminiProvider,
    },
    GeminiSummaryProvider,
    {
      provide: SUMMARY_PROVIDER,
      useExisting: GeminiSummaryProvider,
    },

    ChatSummaryPublisher,
    ChatSummaryConsumer,
  ],
  exports: [LLM_PROVIDER],
})
export class ChatModule {}
