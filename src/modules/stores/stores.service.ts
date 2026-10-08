import { BusinessException, ErrorCode } from '@common';
import { Injectable } from '@nestjs/common';
import { CreateStoreDto } from './dtos/create-store.dto';
import { UpdateStoreDto } from './dtos/update-store.dto';
import { StorePlatform, StoreStatus } from './enums/stores.enums';
import { StoresRepository } from './repositories/stores.repository';
import { StoreDocument } from './schemas/store.schema';

@Injectable()
export class StoresService {
  constructor(private readonly storesRepository: StoresRepository) {}

  async create(dto: CreateStoreDto): Promise<StoreDocument> {
    return this.storesRepository.create(dto);
  }

  async upsertByMerchantId(dto: CreateStoreDto): Promise<StoreDocument> {
    return this.storesRepository.upsertByMerchantId(dto);
  }

  async findById(id: string): Promise<StoreDocument | null> {
    return this.storesRepository.findById(id);
  }

  async getByIdOrFail(id: string): Promise<StoreDocument> {
    const store = await this.storesRepository.findById(id);

    if (!store) {
      throw new BusinessException('Store not found', {
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    return store;
  }

  async getActiveStoreIdByMerchantId(
    merchantId: string,
    platform: StorePlatform = StorePlatform.Salla,
  ): Promise<string> {
    const store = await this.storesRepository.findIdAndStatusByMerchantId(
      merchantId.trim(),
      platform,
    );

    if (!store || store.status !== StoreStatus.Active) {
      throw new BusinessException('Store not found or inactive', {
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    return store._id.toString();
  }

  async update(id: string, dto: UpdateStoreDto): Promise<StoreDocument> {
    const updatedStore = await this.storesRepository.update(id, dto);

    if (!updatedStore) {
      throw new BusinessException('Store not found', {
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    return updatedStore;
  }

  async delete(id: string): Promise<boolean> {
    return this.storesRepository.delete(id);
  }

  async assertOwnership(storeId: string, userId: string): Promise<void> {
    const isOwner = await this.storesRepository.existsWithOwner(storeId, userId);

    if (!isOwner) {
      throw new BusinessException('You do not have access to this store', {
        errorCode: ErrorCode.FORBIDDEN,
      });
    }
  }

  async markOnboardingCompleted(id: string): Promise<StoreDocument | null> {
    return this.storesRepository.markOnboardingCompleted(id);
  }
}
