import { BusinessException, ErrorCode } from '@common';
import { Injectable } from '@nestjs/common';
import { CreateStoreDto } from './dtos/create-store.dto';
import { UpdateStoreDto } from './dtos/update-store.dto';
import { StoreStatus } from './enums/store-status.enum';
import { StoresRepository } from './repositories/stores.repository';
import { StoreDocument } from './schemas/store.schema';

@Injectable()
export class StoresService {
  constructor(private readonly storesRepository: StoresRepository) {}

  async create(data: CreateStoreDto): Promise<StoreDocument> {
    return this.storesRepository.create(data);
  }

  async findById(id: string): Promise<StoreDocument | null> {
    return this.storesRepository.findById(id);
  }

  async update(id: string, data: UpdateStoreDto): Promise<StoreDocument | null> {
    return this.storesRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.storesRepository.delete(id);
  }

  async isOwner(storeId: string, userId: string): Promise<boolean> {
    return this.storesRepository.existsWithOwner(storeId, userId);
  }

  async assertOwnership(storeId: string, userId: string): Promise<void> {
    const isOwner = await this.isOwner(storeId, userId);

    if (!isOwner) {
      throw new BusinessException('You do not have access to this store', {
        errorCode: ErrorCode.FORBIDDEN,
      });
    }
  }

  async markOnboardingCompleted(id: string): Promise<StoreDocument | null> {
    return this.storesRepository.markOnboardingCompleted(id);
  }

  async getActiveStoreIdByExternalId(externalStoreId: string, platform = 'salla'): Promise<string> {
    const store = await this.storesRepository.findByExternalStoreId(externalStoreId, platform);

    if (!store || store.status !== StoreStatus.Active) {
      throw new BusinessException('Store not found or inactive', {
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    return store._id.toString();
  }
}
