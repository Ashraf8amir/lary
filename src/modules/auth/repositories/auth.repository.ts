import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AuthProvider } from '../enums/auth-provider.enum';
import { Auth, AuthDocument } from '../schemas/auth.schema';
import { ActiveSession } from '../schemas/session.schema';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(Auth.name)
    private readonly authModel: Model<AuthDocument>,
  ) {}

  async findByUserId(userId: Types.ObjectId): Promise<AuthDocument | null> {
    return this.authModel.findOne({ userId }).select('+credentials.passwordHash');
  }

  async setPasswordHash(userId: Types.ObjectId, passwordHash: string): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $set: {
          'credentials.passwordHash': passwordHash,
          'credentials.provider': AuthProvider.SALLA,
          'credentials.providerId': null,
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  async clearPassword(userId: Types.ObjectId): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $set: {
          'credentials.passwordHash': null,
        },
      },
    );
  }

  async setProvider(
    userId: Types.ObjectId,
    provider: AuthProvider,
    providerId: string | null = null,
  ): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $set: {
          'credentials.provider': provider,
          'credentials.providerId': providerId ?? null,
        },
        $setOnInsert: {
          'credentials.passwordHash': null,
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  async updatePassword(userId: Types.ObjectId, passwordHash: string): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $set: {
          'credentials.passwordHash': passwordHash,
          'security.lastPasswordChangeAt': new Date(),
        },
        $inc: {
          'security.tokenVersion': 1,
        },
      },
    );
  }

  async incrementTokenVersion(userId: Types.ObjectId): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $inc: { 'security.tokenVersion': 1 },
      },
    );
  }

  async addSession(
    userId: Types.ObjectId,
    session: ActiveSession,
    maxSessions = 5,
  ): Promise<boolean> {
    const result = await this.authModel.updateOne(
      {
        userId,
        $expr: { $lt: [{ $size: '$sessions' }, maxSessions] },
      },
      { $push: { sessions: session } },
    );

    return result.matchedCount > 0;
  }

  async updateSessionToken(
    userId: Types.ObjectId,
    sessionId: string,
    newRefreshTokenHash: string,
    newExpiresAt: Date,
  ): Promise<boolean> {
    const result = await this.authModel.updateOne(
      {
        userId,
        'sessions.sessionId': sessionId,
      },
      {
        $set: {
          'sessions.$.refreshTokenHash': newRefreshTokenHash,
          'sessions.$.expiresAt': newExpiresAt,
          'sessions.$.updatedAt': new Date(),
        },
      },
    );

    return result.matchedCount > 0;
  }

  async deleteSession(userId: Types.ObjectId, sessionId: string): Promise<boolean> {
    const result = await this.authModel.updateOne(
      { userId },
      {
        $pull: {
          sessions: { sessionId },
        },
      },
    );

    return result.modifiedCount > 0;
  }

  async deleteSessionByDeviceId(userId: Types.ObjectId, deviceId: string): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $pull: {
          sessions: { deviceId },
        },
      },
    );
  }

  async deleteAllSessions(userId: Types.ObjectId): Promise<boolean> {
    const result = await this.authModel.updateOne(
      { userId },
      {
        $set: { sessions: [] },
        $inc: { 'security.tokenVersion': 1 },
      },
    );

    return result.modifiedCount > 0;
  }

  async deleteSessionFamily(userId: Types.ObjectId, familyId: string): Promise<boolean> {
    const result = await this.authModel.updateOne(
      { userId },
      {
        $pull: {
          sessions: { familyId },
        },
      },
    );

    return result.modifiedCount > 0;
  }

  async removeExpiredSessions(userId: Types.ObjectId): Promise<void> {
    await this.authModel.updateOne(
      { userId },
      {
        $pull: {
          sessions: { expiresAt: { $lte: new Date() } },
        },
      },
    );
  }

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<AuthDocument | null> {
    const now = new Date();

    return this.authModel
      .findOne({
        sessions: {
          $elemMatch: {
            refreshTokenHash,
            expiresAt: { $gt: now },
          },
        },
      })
      .select('+sessions.refreshTokenHash');
  }

  async findSessionsByUserId(userId: Types.ObjectId | string): Promise<ActiveSession[]> {
    const authDoc = await this.authModel.findOne({ userId }).select('sessions').lean();

    return authDoc?.sessions ?? [];
  }

  async ensureAuthDoc(
    userId: Types.ObjectId,
    provider: AuthProvider = AuthProvider.SALLA,
    providerId: string | null = null,
  ): Promise<AuthDocument> {
    return this.authModel.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          sessions: [],
          credentials: {
            passwordHash: null,
            provider,
            providerId,
          },
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  }
}
