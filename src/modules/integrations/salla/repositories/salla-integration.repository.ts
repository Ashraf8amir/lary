import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model, Types } from 'mongoose';
import { SallaIntegrationStatus } from '../enums/salla-integration-status.enum';
import { SallaIntegration, SallaIntegrationDocument } from '../schemas/salla-integration.schema';

export interface SallaTokensUpdatePayload {
  accessToken: {
    encrypted: string;
    iv: string;
    authTag: string;
    expiresAt: Date;
  };
  refreshToken: {
    encrypted: string;
    iv: string;
    authTag: string;
  };
  lastRefreshedAt: Date;
}

export interface SallaAuthorizePayload {
  storeName?: string;
  merchantEmail: string;
  merchantMobile?: string;
  accessToken: SallaTokensUpdatePayload['accessToken'];
  refreshToken: SallaTokensUpdatePayload['refreshToken'];
  scopes: string[];
}

@Injectable()
export class SallaIntegrationRepository {
  constructor(
    @InjectModel(SallaIntegration.name)
    private readonly integrationModel: Model<SallaIntegrationDocument>,
  ) {}

  async findById(id: string): Promise<SallaIntegrationDocument | null> {
    if (!isValidObjectId(id)) return null;
    return this.integrationModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  }

  async findByStoreId(storeId: string): Promise<SallaIntegrationDocument | null> {
    if (!isValidObjectId(storeId)) return null;
    return this.integrationModel
      .findOne({ storeId: new Types.ObjectId(storeId), isDeleted: { $ne: true } })
      .exec();
  }

  async findBySallaStoreId(sallaStoreId: string): Promise<SallaIntegrationDocument | null> {
    return this.integrationModel
      .findOne({ sallaStoreId: String(sallaStoreId).trim(), isDeleted: { $ne: true } })
      .exec();
  }

  async linkAndActivate(
    sallaStoreId: string,
    data: SallaAuthorizePayload,
    onCreateStoreId: () => Promise<string>,
  ): Promise<SallaIntegrationDocument> {
    const trimmedSallaStoreId = String(sallaStoreId).trim();
    const existing = await this.findBySallaStoreId(trimmedSallaStoreId);

    const storeId = existing ? existing.storeId : new Types.ObjectId(await onCreateStoreId());

    return this.integrationModel
      .findOneAndUpdate(
        { sallaStoreId: trimmedSallaStoreId, isDeleted: { $ne: true } },
        {
          $set: {
            storeId,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            scopes: data.scopes,
            merchantEmail: data.merchantEmail,
            merchantMobile: data.merchantMobile,
            status: SallaIntegrationStatus.Connected,
            connectedAt: new Date(),
            lastRefreshedAt: new Date(),
          },
          $setOnInsert: { sallaStoreId: trimmedSallaStoreId, isDeleted: false },
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
        { _id: id, isDeleted: { $ne: true } },
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

  async markDisconnected(id: string): Promise<SallaIntegrationDocument | null> {
    if (!isValidObjectId(id)) return null;

    return this.integrationModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
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
      .updateOne(
        { _id: objectId, isDeleted: { $ne: true } },
        { $set: { status: SallaIntegrationStatus.TokenExpired } },
      )
      .exec();

    return result.modifiedCount > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;

    const result = await this.integrationModel
      .updateOne(
        { _id: id, isDeleted: { $ne: true } },
        { $set: { isDeleted: true, deletedAt: new Date() } },
      )
      .exec();

    return result.modifiedCount > 0;
  }

  async findExpiringIntegrations(thresholdDate: Date): Promise<SallaIntegrationDocument[]> {
    return this.integrationModel
      .find({
        status: SallaIntegrationStatus.Connected,
        'accessToken.expiresAt': { $lte: thresholdDate },
        isDeleted: { $ne: true },
      })
      .exec();
  }
}
