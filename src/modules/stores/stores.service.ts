import { Injectable } from '@nestjs/common';
import { CreateStoreDto } from './dtos/create-store.dto';
import { UpdateStoreDto } from './dtos/update-store.dto';
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

  async findBySallaId(sallaId: string): Promise<StoreDocument | null> {
    return this.storesRepository.findBySallaId(sallaId);
  }

  async update(id: string, data: UpdateStoreDto): Promise<StoreDocument | null> {
    return this.storesRepository.update(id, data);
  }

  async upsertBySallaId(sallaId: string, data: Partial<CreateStoreDto>): Promise<StoreDocument> {
    return this.storesRepository.upsertBySallaId(sallaId, data);
  }

  async existsBySallaId(sallaId: string): Promise<boolean> {
    return this.storesRepository.existsBySallaId(sallaId);
  }

  async delete(id: string): Promise<boolean> {
    return this.storesRepository.delete(id);
  }
}
