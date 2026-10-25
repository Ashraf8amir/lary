import { Module } from '@nestjs/common';

import { RabbitMqInfrastructureModule } from '@/infrastructure/rabbitmq/rabbitmq.module';

import { AssistantSettingsModule } from '../assistant-settings/assistant-settings.module';
import { ProductsModule } from '../products/products.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LLM_PROVIDER, SUMMARY_PROVIDER } from './constants/chat.constants';
import { GeminiContentMapper } from './mapper/gemini-content.mapper';
import { SystemPromptBuilder } from './prompts/system-prompt.builder';
import { GeminiSummaryProvider } from './providers/gemini-summary.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { ChatPersistConsumer } from './queues/consumers/chat-persist.consumer';
import { ChatSummaryConsumer } from './queues/consumers/chat-summary.consumer';
import { ChatPersistPublisher } from './queues/publishers/chat-persist.publisher';
import { ChatSummaryPublisher } from './queues/publishers/chat-summary.publisher';
import { ChatPersistenceModule } from './chat-persistence.module';
import { ChatGenerationService } from './services/chat-generation.service';
import { ChatResponseBuilder } from './services/chat-response.builder';
import { ConversationContext } from './services/conversation-context.service';
import { ConversationStore } from './services/conversation-store';
import { ConversationSummarizer } from './services/conversation-summarizer';
import { ToolExecutor } from './services/tool-executor';

@Module({
  imports: [
    AssistantSettingsModule,
    ProductsModule,
    RabbitMqInfrastructureModule,
    SubscriptionsModule,
    ChatPersistenceModule,
  ],
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

    ChatPersistPublisher,
    ChatSummaryPublisher,
    ChatSummaryConsumer,
    ChatPersistConsumer,
  ],
  exports: [LLM_PROVIDER, ChatPersistenceModule],
})
export class ChatModule {}

