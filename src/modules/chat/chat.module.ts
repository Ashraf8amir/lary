import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { WidgetSettingsModule } from '../widget-settings/widget-settings.module';
import { LLM_PROVIDER } from './chat.constants';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GeminiContentMapper } from './mapper/gemini-content.mapper';
import { SystemPromptBuilder } from './prompts/system-prompt.builder';
import { GeminiProvider } from './providers/gemini.provider';
import { ConversationSessionService } from './session/conversation-session.service';
import { ToolExecutorService } from './tools/tool-executor.service';

@Module({
  imports: [WidgetSettingsModule, ProductsModule],
  controllers: [ChatController],
  providers: [
    GeminiProvider,
    GeminiContentMapper,
    { provide: LLM_PROVIDER, useExisting: GeminiProvider },
    ChatService,
    ConversationSessionService,
    SystemPromptBuilder,
    ToolExecutorService,
  ],
  exports: [LLM_PROVIDER],
})
export class ChatModule {}
