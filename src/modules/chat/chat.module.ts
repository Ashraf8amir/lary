import chatConfig from '@/config/chat.config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiProvider } from './providers/gemini.provider';

export const LLM_PROVIDER = 'LLM_PROVIDER';

@Module({
  imports: [ConfigModule.forFeature(chatConfig)],
  providers: [
    GeminiProvider,
    {
      provide: LLM_PROVIDER,
      useExisting: GeminiProvider,
    },
  ],
  exports: [LLM_PROVIDER],
})
export class ChatModule {}
