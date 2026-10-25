import { BusinessException, ErrorCode } from '@common';
import { AssistantSettingsService } from '@modules/assistant-settings/assistant-settings.service';
import { ChatMessageDocument } from '@modules/chat/schemas/chat-message.schema';
import { ChatPersistenceRepository } from '@modules/chat/repositories/chat-persistence.repository';
import { SallaIntegrationService } from '@modules/integrations/salla/services/salla-integration.service';
import { ProductsService } from '@modules/products/services/products.service';
import { StoresService } from '@modules/stores/stores.service';
import { SubscriptionStatus } from '@modules/subscriptions/enums/subscription-status.enum';
import { PlansService } from '@modules/subscriptions/services/plans.service';
import { SubscriptionsService } from '@modules/subscriptions/services/subscriptions.service';
import { UsageService } from '@modules/subscriptions/services/usage.service';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { getAllPlanFeatures, getFeatureInfo } from './constants/plan-feature.catalog';
import {
  DASHBOARD_CHAT_CONVERSATIONS_LIMIT_MAX,
  DASHBOARD_CHAT_DEFAULT_LIMIT,
  DASHBOARD_CHAT_MESSAGES_DEFAULT_LIMIT,
  DASHBOARD_CHAT_MESSAGES_LIMIT_MAX,
  DASHBOARD_LATEST_CONVERSATION_LIMIT,
  DASHBOARD_USAGE_HISTORY_MONTHS,
} from './constants/dashboard.constants';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly storesService: StoresService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly plansService: PlansService,
    private readonly usageService: UsageService,
    private readonly productsService: ProductsService,
    private readonly assistantSettingsService: AssistantSettingsService,
    private readonly sallaIntegrationService: SallaIntegrationService,
    private readonly chatPersistenceRepository: ChatPersistenceRepository,
  ) {}

  private limitLabel(value: number): number | string {
    return value === -1 ? 'unlimited' : value;
  }

  private daysRemaining(endDate: Date): number {
    const ms = endDate.getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }

  private calculateUsagePercent(used: number, limit: number): number {
    if (limit === -1 || limit <= 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  }

  async getBilling(storeId: string) {
    const [store, subscription] = await Promise.all([
      this.storesService.getByIdOrFail(storeId),
      this.subscriptionsService.getSubscriptionByStoreId(storeId),
    ]);

    if (!subscription) {
      throw new BusinessException('Store does not have a subscription.', {
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    const [plan, allPlans, currentUsage, usageHistoryDocs, productsUsed] =
      await Promise.all([
        this.plansService.getById(subscription.planId.toString()),
        this.plansService.getAll(),
        this.usageService.getCurrentUsage(
          storeId,
          subscription.startDate,
          subscription.endDate,
        ),
        this.usageService.getUsageHistory(storeId, DASHBOARD_USAGE_HISTORY_MONTHS),
        this.productsService.getStoreProductsUsageCount(storeId),
      ]);

    const hasAccess = [
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.TRIALING,
      SubscriptionStatus.CANCELED,
    ].includes(subscription.status) && subscription.endDate > new Date();

    const messagesLimit = plan?.limits.messagesLimit ?? 0;
    const messagesUsed = currentUsage?.aiMessagesCount ?? 0;
    const isUnlimited = messagesLimit === -1;
    const messagesRemaining = isUnlimited
      ? null
      : Math.max(0, messagesLimit - messagesUsed);
    const usagePercent = this.calculateUsagePercent(messagesUsed, messagesLimit);

    const productsLimit = plan?.limits.productsLimit ?? 0;
    const productsRemaining =
      productsLimit === -1 ? null : Math.max(0, productsLimit - productsUsed);
    const productsPercent = this.calculateUsagePercent(productsUsed, productsLimit);

    const unlockedFeatureKeys = new Set(plan?.features ?? []);
    const unlockedFeatures = (plan?.features ?? []).map(getFeatureInfo);
    const lockedFeatures = getAllPlanFeatures()
      .filter((feature) => !unlockedFeatureKeys.has(feature))
      .map(getFeatureInfo);

    const planDetail = {
      name: plan?.name ?? '',
      slug: plan?.slug ?? '',
      monthlySendingLimit: this.limitLabel(plan?.limits.messagesLimit ?? 0),
      concurrentProductLimit: this.limitLabel(plan?.limits.productsLimit ?? 0),
      chatHistoryRetentionDays: this.limitLabel(
        plan?.limits.historyRetentionDays ?? 0,
      ),
      unlockedFeatures,
      lockedFeatures,
    };

    const plans = allPlans.map((p) => ({
      name: p.name,
      slug: p.slug,
      limits: {
        messagesLimit: p.limits.messagesLimit,
        productsLimit: p.limits.productsLimit,
        historyRetentionDays: p.limits.historyRetentionDays,
      },
      features: (p.features ?? []).map(getFeatureInfo),
      isCurrent: p._id.toString() === subscription.planId.toString(),
    }));

    const usageHistory = usageHistoryDocs.map((u) => ({
      periodStart: u.periodStart.toISOString(),
      periodEnd: u.periodEnd.toISOString(),
      label: `${u.periodStart.getFullYear()}-${String(
        u.periodStart.getMonth() + 1,
      ).padStart(2, '0')}`,
      messagesUsed: u.aiMessagesCount,
    }));

    return {
      store: {
        id: store._id.toString(),
        name: store.name,
        currency: store.currency,
        domain: store.domain,
        avatar: store.avatar,
      },
      subscription: {
        status: subscription.status,
        isTrial: subscription.isTrial,
        trialBadge:
          subscription.isTrial || subscription.status === SubscriptionStatus.TRIALING,
        startDate: subscription.startDate.toISOString(),
        endDate: subscription.endDate.toISOString(),
        renewalOrExpirationDate: subscription.endDate.toISOString(),
        daysRemaining: this.daysRemaining(subscription.endDate),
        hasAccess,
        currentPlanSlug: plan?.slug ?? '',
      },
      plan: planDetail,
      usage: {
        periodStart: subscription.startDate.toISOString(),
        periodEnd: subscription.endDate.toISOString(),
        messagesUsed,
        messagesLimit: isUnlimited ? null : messagesLimit,
        messagesRemaining,
        usagePercent,
        isUnlimited,
      },
      usageHistory,
      products: {
        used: productsUsed,
        limit: productsLimit === -1 ? null : productsLimit,
        remaining: productsRemaining,
        usagePercent: productsPercent,
      },
      plans,
    };
  }

  async getOverview(storeId: string) {
    const store = await this.storesService.getByIdOrFail(storeId);

    const subscription = await this.subscriptionsService
      .getSubscriptionByStoreId(storeId)
      .catch((error) => {
        this.logger.error('Failed to load subscription for overview', error);
        return null;
      });

    const planPromise = subscription
      ? this.plansService.getById(subscription.planId.toString()).catch((error) => {
          this.logger.error('Failed to load plan for overview', error);
          return null;
        })
      : Promise.resolve(null);

    const currentUsagePromise = subscription
      ? this.usageService
          .getCurrentUsage(storeId, subscription.startDate, subscription.endDate)
          .catch((error) => {
            this.logger.error('Failed to load usage for overview', error);
            return null;
          })
      : Promise.resolve(null);

    const [
      planResult,
      assistantResult,
      sallaResult,
      currentUsageResult,
      productsResult,
      conversationsResult,
      messagesResult,
      lastConversationsResult,
    ] = await Promise.allSettled([
      planPromise,
      this.assistantSettingsService.getSettingsForDashboard(storeId),
      this.sallaIntegrationService.getIntegrationStatus(storeId),
      currentUsagePromise,
      this.productsService.getStoreProductsUsageCount(storeId),
      this.chatPersistenceRepository.countConversations(storeId),
      this.chatPersistenceRepository.countMessages(storeId),
      this.chatPersistenceRepository.listConversations(storeId, DASHBOARD_LATEST_CONVERSATION_LIMIT, 0),
    ]);

    const plan = planResult.status === 'fulfilled' ? planResult.value : null;
    const assistant =
      assistantResult.status === 'fulfilled' ? assistantResult.value : null;
    const salla = sallaResult.status === 'fulfilled' ? sallaResult.value : null;
    const currentUsage =
      currentUsageResult.status === 'fulfilled' ? currentUsageResult.value : null;
    const productsUsed =
      productsResult.status === 'fulfilled' ? productsResult.value : 0;
    const totalConversations =
      conversationsResult.status === 'fulfilled' ? conversationsResult.value : 0;
    const totalMessages =
      messagesResult.status === 'fulfilled' ? messagesResult.value : 0;
    const lastConversationDocs =
      lastConversationsResult.status === 'fulfilled'
        ? lastConversationsResult.value
        : [];

    if (assistantResult.status === 'rejected') {
      this.logger.error('Failed to load assistant settings for overview', assistantResult.reason);
    }
    if (sallaResult.status === 'rejected') {
      this.logger.error('Failed to load Salla status for overview', sallaResult.reason);
    }
    if (productsResult.status === 'rejected') {
      this.logger.error('Failed to count products for overview', productsResult.reason);
    }
    if (conversationsResult.status === 'rejected') {
      this.logger.error(
        'Failed to count conversations for overview',
        conversationsResult.reason,
      );
    }
    if (messagesResult.status === 'rejected') {
      this.logger.error('Failed to count messages for overview', messagesResult.reason);
    }
    if (lastConversationsResult.status === 'rejected') {
      this.logger.error(
        'Failed to load latest conversation for overview',
        lastConversationsResult.reason,
      );
    }

    const messagesLimit = plan?.limits.messagesLimit ?? 0;
    const messagesUsed = currentUsage?.aiMessagesCount ?? 0;
    const isUnlimited = messagesLimit === -1;
    const usagePercent = this.calculateUsagePercent(messagesUsed, messagesLimit);

    const productsLimit = plan?.limits.productsLimit ?? 0;
    const productsPercent = this.calculateUsagePercent(productsUsed, productsLimit);

    const lastActivityAt =
      Array.isArray(lastConversationDocs) && lastConversationDocs.length > 0
        ? lastConversationDocs[0].lastMessageAt.toISOString()
        : null;

    const hasAccess = subscription
      ? [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.TRIALING,
          SubscriptionStatus.CANCELED,
        ].includes(subscription.status) && subscription.endDate > new Date()
      : false;

    return {
      store: {
        id: store._id.toString(),
        name: store.name,
        currency: store.currency,
        avatar: store.avatar,
      },
      subscriptionSummary: subscription
        ? {
            planName: plan?.name ?? '',
            status: subscription.status,
            trialBadge:
              subscription.isTrial || subscription.status === SubscriptionStatus.TRIALING,
            daysRemaining: this.daysRemaining(subscription.endDate),
            hasAccess,
          }
        : null,
      usageSummary: {
        messagesUsed,
        messagesLimit: isUnlimited ? null : messagesLimit,
        usagePercent,
        periodEnd: subscription ? subscription.endDate.toISOString() : null,
      },
      productSlots: {
        used: productsUsed,
        limit: productsLimit === -1 ? null : productsLimit,
        usagePercent: productsPercent,
      },
      assistant: {
        isEnabled: assistant?.isEnabled ?? false,
        botName: assistant?.botName ?? '',
        avatarUrl: assistant?.avatarUrl ?? null,
      },
      salla: {
        connected: salla?.connected ?? false,
        status: salla?.status ?? null,
      },
      activity: {
        totalConversations,
        totalMessages,
        lastActivityAt,
      },
    };
  }

  async getChatSummary(storeId: string, limit = DASHBOARD_CHAT_DEFAULT_LIMIT, skip = 0) {
    const safeLimit = Math.min(Math.max(1, limit), DASHBOARD_CHAT_CONVERSATIONS_LIMIT_MAX);
    const safeSkip = Math.max(0, skip);

    const [totalConversations, totalMessages, docs] = await Promise.all([
      this.chatPersistenceRepository.countConversations(storeId),
      this.chatPersistenceRepository.countMessages(storeId),
      this.chatPersistenceRepository.listConversations(storeId, safeLimit, safeSkip),
    ]);

    const conversations = docs.map((doc) => ({
      conversationId: doc.conversationId,
      title: doc.title ?? null,
      messageCount: doc.messageCount,
      lastMessageAt: doc.lastMessageAt.toISOString(),
      expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : null,
    }));

    return {
      totalConversations,
      totalMessages,
      conversations,
    };
  }

  async getChatConversation(storeId: string, conversationId: string, limit = DASHBOARD_CHAT_MESSAGES_DEFAULT_LIMIT, skip = 0) {
    const safeLimit = Math.min(Math.max(1, limit), DASHBOARD_CHAT_MESSAGES_LIMIT_MAX);
    const safeSkip = Math.max(0, skip);

    const conversation = await this.chatPersistenceRepository.getConversation(
      storeId,
      conversationId,
    );
    if (!conversation) {
      return null;
    }

    const messages = await this.chatPersistenceRepository.listMessages(
      storeId,
      conversationId,
      safeLimit,
      safeSkip,
    );

    return {
      conversationId: conversation.conversationId,
      title: conversation.title ?? null,
      messageCount: conversation.messageCount,
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      expiresAt: conversation.expiresAt ? conversation.expiresAt.toISOString() : null,
      messages: messages.map((m: ChatMessageDocument & { createdAt?: Date }) => ({
        sequence: m.sequence,
        role: m.role,
        content: m.content,
        cards: m.cards ?? null,
        createdAt: m.createdAt?.toISOString?.() ?? new Date().toISOString(),
      })),
    };
  }
}

