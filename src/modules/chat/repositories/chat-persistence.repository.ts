import type { ProductCard } from '@modules/products/interfaces/product-card.interface';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';

import {
  buildConversationTitle,
  ChatConversation,
  ChatConversationDocument,
} from '../schemas/chat-conversation.schema';
import { ChatMessage, ChatMessageDocument } from '../schemas/chat-message.schema';

const PERSISTED_MESSAGES_PER_TURN = 2;

export interface ArchiveTurnInput {
  storeId: string;
  conversationId: string;
  userMessage: string;
  assistantMessage: string;
  cards: ProductCard[];
  archivedAt: Date;
  expiresAt?: Date;
}

@Injectable()
export class ChatPersistenceRepository {
  constructor(
    @InjectModel(ChatConversation.name)
    private readonly conversationModel: Model<ChatConversationDocument>,
    @InjectModel(ChatMessage.name)
    private readonly messageModel: Model<ChatMessageDocument>,
  ) {}

  async archiveTurn(input: ArchiveTurnInput, session?: ClientSession): Promise<void> {
    const storeId = new Types.ObjectId(input.storeId);
    const conversation = await this.reserveConversationSequence(storeId, input, session);

    const firstSequence = conversation.messageCount - PERSISTED_MESSAGES_PER_TURN;

    const messages: Partial<ChatMessageDocument>[] = [
      {
        storeId,
        conversationId: input.conversationId,
        sequence: firstSequence,
        role: 'user',
        content: input.userMessage,
        expiresAt: input.expiresAt,
      },
      {
        storeId,
        conversationId: input.conversationId,
        sequence: conversation.messageCount - 1,
        role: 'assistant',
        content: input.assistantMessage,
        ...(input.cards.length > 0 ? { cards: input.cards } : {}),
        expiresAt: input.expiresAt,
      },
    ];

    await this.messageModel.insertMany(messages, { session });
  }

  async listConversations(
    storeId: string,
    limit = 20,
    skip = 0,
  ): Promise<ChatConversationDocument[]> {
    if (!Types.ObjectId.isValid(storeId)) return [];

    return this.conversationModel
      .find({ storeId: new Types.ObjectId(storeId) })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countConversations(storeId: string): Promise<number> {
    if (!Types.ObjectId.isValid(storeId)) return 0;

    return this.conversationModel.countDocuments({ storeId: new Types.ObjectId(storeId) }).exec();
  }

  async getConversation(
    storeId: string,
    conversationId: string,
  ): Promise<ChatConversationDocument | null> {
    if (!Types.ObjectId.isValid(storeId)) return null;

    return this.conversationModel
      .findOne({
        storeId: new Types.ObjectId(storeId),
        conversationId,
      })
      .exec();
  }

  async listMessages(
    storeId: string,
    conversationId: string,
    limit = 100,
    skip = 0,
  ): Promise<ChatMessageDocument[]> {
    if (!Types.ObjectId.isValid(storeId)) return [];

    return this.messageModel
      .find({
        storeId: new Types.ObjectId(storeId),
        conversationId,
      })
      .sort({ sequence: 1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countMessages(storeId: string): Promise<number> {
    if (!Types.ObjectId.isValid(storeId)) return 0;

    return this.messageModel.countDocuments({ storeId: new Types.ObjectId(storeId) }).exec();
  }

  private async reserveConversationSequence(
    storeId: Types.ObjectId,
    input: ArchiveTurnInput,
    session?: ClientSession,
  ): Promise<ChatConversationDocument> {
    const update: Record<string, unknown> = {
      $set: { lastMessageAt: input.archivedAt },
      $inc: { messageCount: PERSISTED_MESSAGES_PER_TURN },
    };

    const title = buildConversationTitle(input.userMessage);
    const setOnInsert: Record<string, unknown> = title ? { title } : {};

    if (Object.keys(setOnInsert).length > 0) {
      update.$setOnInsert = setOnInsert;
    }

    if (input.expiresAt) {
      update.$max = { expiresAt: input.expiresAt };
    } else {
      update.$unset = { expiresAt: 1 };
    }

    const document = await this.conversationModel
      .findOneAndUpdate({ storeId, conversationId: input.conversationId }, update, {
        upsert: true,
        returnDocument: 'after',
        session,
      })
      .exec();

    if (!document) {
      throw new Error(`Failed to upsert chat conversation ${input.conversationId}`);
    }

    return document;
  }
}
