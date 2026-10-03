import { ProductCard } from '@modules/products/interfaces/product-card.interface';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { LLM_PROVIDER, MAX_TOOL_ROUNDS } from '../chat.constants';
import { ChatGenerationResult } from '../interfaces/chat-generation-result.interface';
import type { LlmMessage, LlmProvider } from '../interfaces/llm-provider.interface';
import { ALL_TOOLS } from '../tools/tool-definitions';
import { ToolExecutor } from './tool-executor';

interface GenerateChatParams {
  history: LlmMessage[];
  userMessage: string;
  systemPrompt: string;
  storeId: string;
  conversationId: string;
}

@Injectable()
export class ChatGenerationService {
  private readonly logger = new Logger(ChatGenerationService.name);

  constructor(
    @Inject(LLM_PROVIDER)
    private readonly llmProvider: LlmProvider,
    private readonly toolExecutor: ToolExecutor,
  ) {}

  async generate({
    history,
    userMessage,
    systemPrompt,
    storeId,
    conversationId,
  }: GenerateChatParams): Promise<ChatGenerationResult> {
    const messages: LlmMessage[] = [...history, { role: 'user', content: userMessage }];

    const messagesToSave: LlmMessage[] = [{ role: 'user', content: userMessage }];

    const cards: ProductCard[] = [];

    let finalText: string | null = null;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await this.llmProvider.generateResponse(messages, ALL_TOOLS, systemPrompt);

      if (!response.toolCalls?.length) {
        finalText = response.text || 'عذراً، لم أتمكن من إتمام طلبك، ممكن تعيد صياغته؟';

        break;
      }

      const assistantToolRequestMessage: LlmMessage = {
        role: 'assistant',
        content: response.text || '',
        toolCalls: response.toolCalls,
      };

      messages.push(assistantToolRequestMessage);
      messagesToSave.push(assistantToolRequestMessage);

      const toolResults = await Promise.all(
        response.toolCalls.map(async (toolCall) => {
          const result = await this.toolExecutor.execute(toolCall.toolName, toolCall.arguments, {
            storeId,
          });

          if (result.cards?.length) {
            cards.push(...result.cards);
          }

          return {
            role: 'tool' as const,
            toolName: toolCall.toolName,
            toolCallId: toolCall.id,
            content: result.forModel,
          };
        }),
      );

      messages.push(...toolResults);
      messagesToSave.push(...toolResults);

      if (round === MAX_TOOL_ROUNDS - 1) {
        this.logger.warn(
          `Conversation ${conversationId} hit MAX_TOOL_ROUNDS without a final answer`,
        );

        finalText = 'ممكن توضح طلبك أكتر عشان أقدر أساعدك صح';
      }
    }

    return {
      finalText: finalText || 'عذراً، لم أتمكن من إتمام طلبك، ممكن تعيد صياغته؟',
      messagesToSave,
      cards,
    };
  }
}
