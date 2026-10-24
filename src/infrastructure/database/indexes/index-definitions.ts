import { type mongo } from 'mongoose';

export type CreateIndexesOptions = mongo.CreateIndexesOptions;
export type IndexSpecification = mongo.IndexSpecification;

export interface IndexDefinition {
  collection: string;
  spec: IndexSpecification;
  options?: CreateIndexesOptions;
}

export const INDEX_DEFINITIONS: IndexDefinition[] = [
  // ==========================================
  // 1. AssistantSettings (assistant_settings)
  // ==========================================
  {
    collection: 'assistant_settings',
    spec: { storeId: 1 },
    options: { unique: true },
  },

  // ==========================================
  // 2. Auth (auth_credentials)
  // ==========================================
  {
    collection: 'auth_credentials',
    spec: { userId: 1 },
    options: { unique: true },
  },
  {
    collection: 'auth_credentials',
    spec: { 'credentials.provider': 1 },
  },
  {
    collection: 'auth_credentials',
    spec: { 'credentials.providerId': 1 },
  },
  {
    collection: 'auth_credentials',
    spec: { 'sessions.sessionId': 1 },
  },
  {
    collection: 'auth_credentials',
    spec: { 'sessions.familyId': 1 },
  },

  // ==========================================
  // 3. SallaIntegration (salla_integrations)
  // ==========================================
  {
    collection: 'salla_integrations',
    spec: { storeId: 1 },
    options: { unique: true },
  },
  {
    collection: 'salla_integrations',
    spec: { merchantId: 1 },
    options: { unique: true },
  },
  {
    collection: 'salla_integrations',
    spec: { status: 1 },
  },
  {
    collection: 'salla_integrations',
    spec: { status: 1, 'accessToken.expiresAt': 1 },
  },

  // ==========================================
  // 4. Product (products)
  // ==========================================
  {
    collection: 'products',
    spec: { storeId: 1 },
  },
  {
    collection: 'products',
    spec: { platform: 1 },
  },
  {
    collection: 'products',
    spec: { category: 1 },
  },
  {
    collection: 'products',
    spec: { categories: 1 },
  },
  {
    collection: 'products',
    spec: { brand: 1 },
  },
  {
    collection: 'products',
    spec: { status: 1 },
  },
  {
    collection: 'products',
    spec: { storeId: 1, platform: 1, externalId: 1 },
    options: { unique: true },
  },
  {
    collection: 'products',
    spec: { storeId: 1, 'variants.externalId': 1 },
  },
  {
    collection: 'products',
    spec: { storeId: 1, status: 1, priceAmount: 1 },
  },

  // ==========================================
  // 5. Store (stores)
  // ==========================================
  {
    collection: 'stores',
    spec: { ownerId: 1 },
  },
  {
    collection: 'stores',
    spec: { status: 1 },
  },
  {
    collection: 'stores',
    spec: { merchantId: 1 },
  },
  {
    collection: 'stores',
    spec: { platform: 1, merchantId: 1 },
    options: { unique: true, sparse: true },
  },

  // ==========================================
  // 6. User (users)
  // ==========================================
  {
    collection: 'users',
    spec: { email: 1 },
    options: { unique: true },
  },

  // ==========================================
  // 7. MessageIdempotency (processed_messages)
  // ==========================================
  {
    collection: 'processed_messages',
    spec: { messageId: 1 },
    options: { unique: true },
  },
  {
    collection: 'processed_messages',
    spec: { status: 1, startedAt: 1 },
  },

  // ==========================================
  // 8. Chat persistence (chat_conversations / chat_messages)
  // ==========================================
  {
    collection: 'chat_conversations',
    spec: { storeId: 1 },
  },
  {
    collection: 'chat_conversations',
    spec: { storeId: 1, conversationId: 1 },
    options: { unique: true },
  },
  {
    collection: 'chat_conversations',
    spec: { storeId: 1, lastMessageAt: -1 },
  },
  {
    collection: 'chat_conversations',
    spec: { expiresAt: 1 },
    options: { expireAfterSeconds: 0 },
  },
  {
    collection: 'chat_messages',
    spec: { storeId: 1 },
  },
  {
    collection: 'chat_messages',
    spec: { storeId: 1, conversationId: 1, sequence: 1 },
  },
  {
    collection: 'chat_messages',
    spec: { storeId: 1, conversationId: 1, createdAt: 1 },
  },
  {
    collection: 'chat_messages',
    spec: { expiresAt: 1 },
    options: { expireAfterSeconds: 0 },
  },

  // ==========================================
  // 9. Subscriptions
  // ==========================================
  {
    collection: 'plans',
    spec: { slug: 1 },
    options: { unique: true },
  },
  {
    collection: 'subscriptions',
    spec: { storeId: 1 },
    options: { unique: true },
  },
  {
    collection: 'subscriptions',
    spec: { sallaSubscriptionId: 1 },
    options: { unique: true, sparse: true },
  },
  {
    collection: 'usages',
    spec: { storeId: 1 },
  },
  {
    collection: 'usages',
    spec: { storeId: 1, subscriptionId: 1, periodStart: 1, periodEnd: 1 },
    options: { unique: true },
  },
];
