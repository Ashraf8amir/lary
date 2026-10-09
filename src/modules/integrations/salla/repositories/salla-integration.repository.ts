import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model, Types } from 'mongoose';
import { SallaIntegrationStatus } from '../enums/salla-integration-status.enum';
import {
  SallaAuthorizePayload,
  SallaTokensUpdatePayload,
} from '../interfaces/salla-integration.interface';
import { SallaIntegration, SallaIntegrationDocument } from '../schemas/salla-integration.schema';

@Injectable()
export class SallaIntegrationRepository {
  constructor(
    @InjectModel(SallaIntegration.name)
    private readonly integrationModel: Model<SallaIntegrationDocument>,
  ) {}

  async findById(id: string): Promise<SallaIntegrationDocument | null> {
    if (!isValidObjectId(id)) return null;
    return this.integrationModel.findOne({ _id: id }).exec();
  }

  async findByStoreId(storeId: string): Promise<SallaIntegrationDocument | null> {
    if (!isValidObjectId(storeId)) return null;
    return this.integrationModel.findOne({ storeId: new Types.ObjectId(storeId) }).exec();
  }

  async findByMerchantId(merchantId: string): Promise<SallaIntegrationDocument | null> {
    return this.integrationModel.findOne({ merchantId: String(merchantId).trim() }).exec();
  }

  async linkAndActivate(
    merchantId: string,
    storeId: string,
    data: SallaAuthorizePayload,
  ): Promise<SallaIntegrationDocument> {
    const trimmedMerchantId = String(merchantId).trim();
    const storeObjectId = new Types.ObjectId(storeId);

    return this.integrationModel
      .findOneAndUpdate(
        { merchantId: trimmedMerchantId },
        {
          $set: {
            storeId: storeObjectId,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            scopes: data.scopes,
            status: SallaIntegrationStatus.Connected,
            lastRefreshedAt: new Date(),
          },
          $setOnInsert: {
            merchantId: trimmedMerchantId,
            connectedAt: new Date(),
          },
        },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .exec();
  }

  async updateTokens(
    id: string,
    tokens: SallaTokensUpdatePayload,
  ): Promise<SallaIntegrationDocument | null> {
    if (!isValidObjectId(id)) return null;

    return this.integrationModel
      .findOneAndUpdate(
        { _id: id },
        {
          $set: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            lastRefreshedAt: tokens.lastRefreshedAt ?? new Date(),
            status: SallaIntegrationStatus.Connected,
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
  }

  async updateLastSyncAt(storeId: string, syncedAt: Date = new Date()): Promise<void> {
    if (!isValidObjectId(storeId)) return;

    await this.integrationModel
      .updateOne({ storeId: new Types.ObjectId(storeId) }, { $set: { lastSyncAt: syncedAt } })
      .exec();
  }

  async markDisconnected(id: string): Promise<SallaIntegrationDocument | null> {
    if (!isValidObjectId(id)) return null;

    return this.integrationModel
      .findOneAndUpdate(
        { _id: id },
        {
          $set: { status: SallaIntegrationStatus.Disconnected, disconnectedAt: new Date() },
          $unset: { accessToken: 1, refreshToken: 1 },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
  }

  async markTokenExpired(id: string | Types.ObjectId): Promise<boolean> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;

    const result = await this.integrationModel
      .updateOne({ _id: objectId }, { $set: { status: SallaIntegrationStatus.TokenExpired } })
      .exec();

    return result.modifiedCount > 0;
  }

  async findExpiringIntegrations(thresholdDate: Date): Promise<SallaIntegrationDocument[]> {
    return this.integrationModel
      .find({
        status: SallaIntegrationStatus.Connected,
        'accessToken.expiresAt': { $lte: thresholdDate },
      })
      .exec();
  }

  async findAllByStatus(status: SallaIntegrationStatus): Promise<SallaIntegrationDocument[]> {
    return this.integrationModel.find({ status }).exec();
  }
}
