import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthRepository } from '../repositories/auth.repository';
import { ActiveSession } from '../schemas/session.schema';

@Injectable()
export class SessionService {
  constructor(private readonly authRepository: AuthRepository) {}

  async createSession(userId: Types.ObjectId, session: ActiveSession): Promise<void> {
    const isAdded = await this.authRepository.addSession(userId, session);
    if (!isAdded) {
      throw new NotFoundException('Auth credentials not found');
    }
  }

  async deleteSession(userId: Types.ObjectId, sessionId: string): Promise<boolean> {
    return this.authRepository.deleteSession(userId, sessionId);
  }

  async deleteAllSessions(userId: Types.ObjectId): Promise<boolean> {
    return this.authRepository.deleteAllSessions(userId);
  }

  async deleteSessionFamily(userId: Types.ObjectId, familyId: string): Promise<boolean> {
    return this.authRepository.deleteSessionFamily(userId, familyId);
  }

  async removeExpiredSessions(userId: Types.ObjectId): Promise<void> {
    await this.authRepository.removeExpiredSessions(userId);
  }

  async getActiveSessions(userId: Types.ObjectId, currentSessionId: string) {
    const sessions = await this.authRepository.findSessionsByUserId(userId);
    const now = new Date();

    return sessions
      .filter((session) => session.expiresAt > now)
      .map((session) => ({
        sessionId: session.sessionId,
        deviceName: session.deviceName,
        browser: session.browser,
        os: session.os,
        deviceType: session.deviceType,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isCurrent: session.sessionId === currentSessionId,
      }));
  }
}
