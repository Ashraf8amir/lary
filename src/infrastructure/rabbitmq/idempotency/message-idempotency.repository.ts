import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';

import {
  MessageIdempotency,
  MessageIdempotencyDocument,
  MessageProcessingStatus,
} from './message-idempotency.schema';

@Injectable()
export class MessageIdempotencyRepository {
  constructor(
    @InjectModel(MessageIdempotency.name)
    private readonly model: Model<MessageIdempotencyDocument>,
  ) {}

  async createProcessing(messageId: string, event: string): Promise<boolean> {
    try {
      await this.model.create([
        {
          messageId,
          event,
          status: MessageProcessingStatus.PROCESSING,
          startedAt: new Date(),
        },
      ]);

      return true;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 11000) {
        return false;
      }

      throw error;
    }
  }

  async findByMessageId(messageId: string): Promise<MessageIdempotencyDocument | null> {
    return this.model.findOne({ messageId });
  }

  async reclaimStaleProcessing(messageId: string, staleBefore: Date): Promise<boolean> {
    const result = await this.model.updateOne(
      {
        messageId,
        status: MessageProcessingStatus.PROCESSING,
        startedAt: { $lt: staleBefore },
      },
      {
        $set: { startedAt: new Date() },
      },
    );

    return result.modifiedCount === 1;
  }

  async markAsCompleted(messageId: string, session: ClientSession): Promise<void> {
    const result = await this.model.updateOne(
      {
        messageId,
        status: MessageProcessingStatus.PROCESSING,
      },
      {
        $set: {
          status: MessageProcessingStatus.COMPLETED,
          completedAt: new Date(),
        },
      },
      {
        session,
      },
    );

    if (result.modifiedCount !== 1) {
      throw new Error(`Failed to mark message as completed: ${messageId}`);
    }
  }

  async markAsFailed(messageId: string): Promise<void> {
    await this.model.updateOne(
      {
        messageId,
        status: MessageProcessingStatus.PROCESSING,
      },
      {
        $set: {
          status: MessageProcessingStatus.FAILED,
          completedAt: new Date(),
        },
      },
    );
  }
  async deleteByMessageId(messageId: string): Promise<void> {
    await this.model.deleteOne({ messageId });
  }
}
