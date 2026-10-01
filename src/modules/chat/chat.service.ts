import { ProductCard } from '@modules/products/interfaces/product-card.interface';
import { WidgetSettingsService } from '@modules/widget-settings/widget-settings.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { LLM_PROVIDER, MAX_TOOL_ROUNDS, SUMMARY_MESSAGE_INTERVAL } from './chat.constants';
import { ChatResponse } from './interfaces/chat-response.interface';
import type { LlmMessage, LlmProvider } from './interfaces/llm-provider.interface';
import { SystemPromptBuilder } from './prompts/system-prompt.builder';
import { ChatSummaryPublisher } from './queues/publishers/chat-summary.publisher';
import { ConversationSessionService } from './services/conversation-session.service';
import { ToolExecutorService } from './services/tool-executor.service';
import { ALL_TOOLS } from './tools/tool-definitions';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(LLM_PROVIDER)
    private readonly llmProvider: LlmProvider,
    private readonly sessionService: ConversationSessionService,
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly systemPromptBuilder: SystemPromptBuilder,
    private readonly toolExecutor: ToolExecutorService,
    private readonly chatSummaryPublisher: ChatSummaryPublisher,
  ) {}

  async handleMessage(
    conversationId: string,
    storeId: string,
    userMessage: string,
  ): Promise<ChatResponse> {
    const [recentHistory, conversationSummary, promptSettings] = await Promise.all([
      this.sessionService.getHistory(conversationId),
      this.sessionService.getSummary(conversationId),
      this.widgetSettingsService.getForSystemPrompt(storeId),
    ]);

    const systemPrompt = this.systemPromptBuilder.build({
      ...promptSettings,
      conversationSummary,
    });

    const safeHistory = this.getSafeRecentHistory(recentHistory, 10);

    const messages: LlmMessage[] = [...safeHistory, { role: 'user', content: userMessage }];

    const allCards: ProductCard[] = [];
    let finalText: string | null = null;

    const newMessagesToSave: LlmMessage[] = [{ role: 'user', content: userMessage }];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await this.llmProvider.generateResponse(messages, ALL_TOOLS, systemPrompt);

      if (!response.toolCalls || response.toolCalls.length === 0) {
        finalText = response.text || 'عذراً، لم أتمكن من إتمام طلبك، ممكن تعيد صياغته؟';

        newMessagesToSave.push({ role: 'assistant', content: finalText });
        break;
      }

      const assistantToolRequestMsg: LlmMessage = {
        role: 'assistant',
        content: response.text || '',
        toolCalls: response.toolCalls,
      };
      messages.push(assistantToolRequestMsg);
      newMessagesToSave.push(assistantToolRequestMsg);

      const toolExecutionPromises = response.toolCalls.map(async (toolCall) => {
        const result = await this.toolExecutor.execute(toolCall.toolName, toolCall.arguments, {
          storeId,
        });

        if (result.cards && result.cards.length > 0) {
          allCards.push(...result.cards);
        }

        return {
          role: 'tool' as const,
          toolName: toolCall.toolName,
          toolCallId: toolCall.id,
          content: result.forModel,
        };
      });

      const toolResultsMessages = await Promise.all(toolExecutionPromises);

      messages.push(...toolResultsMessages);
      newMessagesToSave.push(...toolResultsMessages);

      if (round === MAX_TOOL_ROUNDS - 1) {
        this.logger.warn(
          `Conversation ${conversationId} hit MAX_TOOL_ROUNDS without a final answer`,
        );
        finalText = 'لقيت لك بعض النتائج، بس محتاج توضح طلبك أكتر عشان أقدر أساعدك صح';
        newMessagesToSave.push({ role: 'assistant', content: finalText });
        break;
      }
    }

    await this.sessionService.appendMessages(conversationId, newMessagesToSave);

    this.checkAndTriggerSummary(conversationId).catch((err) => {
      this.logger.error(`Failed to trigger summary for conv: ${conversationId}`, err);
    });

    return {
      replyText: finalText!,
      cards: this.deduplicateCards(allCards),
    };
  }

  private async checkAndTriggerSummary(conversationId: string): Promise<void> {
    const [allMessages, lastSummarizedCount] = await Promise.all([
      this.sessionService.getHistory(conversationId),
      this.sessionService.getLastSummarizedCount(conversationId),
    ]);

    const totalCount = allMessages.length;
    const diff = totalCount - lastSummarizedCount;

    if (diff >= SUMMARY_MESSAGE_INTERVAL) {
      await this.chatSummaryPublisher.publishSummarize(conversationId, totalCount);
    }
  }

  private getSafeRecentHistory(
    allMessages: LlmMessage[],
    humanTurnLimit: number = 10,
  ): LlmMessage[] {
    if (!Array.isArray(allMessages) || allMessages.length === 0) {
      return [];
    }

    let humanCount = 0;
    let startIndex = 0;

    for (let i = allMessages.length - 1; i >= 0; i--) {
      const msg = allMessages[i];

      const isHumanTurn =
        msg.role === 'user' ||
        (msg.role === 'assistant' && (!msg.toolCalls || msg.toolCalls.length === 0));

      if (isHumanTurn) {
        humanCount++;
      }

      if (humanCount >= humanTurnLimit) {
        startIndex = i;
        break;
      }
    }

    const contextSlice = allMessages.slice(startIndex);

    while (contextSlice.length > 0 && contextSlice[0].role === 'tool') {
      contextSlice.shift();
    }

    while (contextSlice.length > 0 && contextSlice[0].role !== 'user') {
      contextSlice.shift();
    }

    return contextSlice;
  }

  private deduplicateCards(cards: ProductCard[]): ProductCard[] {
    const uniqueMap = new Map<string, ProductCard>();
    for (const card of cards) {
      uniqueMap.set(card.variantId, card);
    }
    return Array.from(uniqueMap.values());
  }
}
