import { Injectable } from '@nestjs/common';
import { CreateStoreMemberDto } from './dtos/create-store-member.dto';
import { UpdateStoreMemberDto } from './dtos/update-store-member.dto';
import { StoreMembersRepository } from './repositories/store-members.repository';
import { StoreMemberDocument } from './schemas/store-member.schema';

@Injectable()
export class StoreMembersService {
  constructor(private readonly membersRepository: StoreMembersRepository) {}

  async create(data: CreateStoreMemberDto): Promise<StoreMemberDocument> {
    return this.membersRepository.create(data);
  }

  async findById(id: string): Promise<StoreMemberDocument | null> {
    return this.membersRepository.findById(id);
  }

  async findByUserAndStore(userId: string, storeId: string): Promise<StoreMemberDocument | null> {
    return this.membersRepository.findByUserAndStore(userId, storeId);
  }

  async findByUserId(userId: string): Promise<StoreMemberDocument[]> {
    return this.membersRepository.findByUserId(userId);
  }

  async findByStoreId(storeId: string): Promise<StoreMemberDocument[]> {
    return this.membersRepository.findByStoreId(storeId);
  }

  async update(id: string, data: UpdateStoreMemberDto): Promise<StoreMemberDocument | null> {
    return this.membersRepository.update(id, data);
  }

  async remove(id: string): Promise<boolean> {
    return this.membersRepository.delete(id);
  }
}
