import { BusinessException, ErrorCode } from '@common';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model } from 'mongoose';
import { CreateStoreMemberDto } from '../dtos/create-store-member.dto';
import { UpdateStoreMemberDto } from '../dtos/update-store-member.dto';
import { StoreMember, StoreMemberDocument } from '../schemas/store-member.schema';

@Injectable()
export class StoreMembersRepository {
  constructor(
    @InjectModel(StoreMember.name)
    private readonly memberModel: Model<StoreMemberDocument>,
  ) {}

  async create(data: CreateStoreMemberDto): Promise<StoreMemberDocument> {
    try {
      return await this.memberModel.create(data);
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 11000) {
        throw new BusinessException('User is already a member of this store', {
          statusCode: HttpStatus.CONFLICT,
          errorCode: ErrorCode.DUPLICATE_ENTRY,
        });
      }
      throw error;
    }
  }

  async findById(id: string): Promise<StoreMemberDocument | null> {
    if (!isValidObjectId(id)) return null;
    return this.memberModel.findById(id).exec();
  }

  async findByUserAndStore(userId: string, storeId: string): Promise<StoreMemberDocument | null> {
    if (!isValidObjectId(userId) || !isValidObjectId(storeId)) return null;
    return this.memberModel.findOne({ userId, storeId }).exec();
  }

  async findByUserId(userId: string): Promise<StoreMemberDocument[]> {
    if (!isValidObjectId(userId)) return [];
    return this.memberModel.find({ userId }).exec();
  }

  async findByStoreId(storeId: string): Promise<StoreMemberDocument[]> {
    if (!isValidObjectId(storeId)) return [];
    return this.memberModel.find({ storeId }).exec();
  }

  async update(id: string, data: UpdateStoreMemberDto): Promise<StoreMemberDocument | null> {
    if (!isValidObjectId(id)) return null;

    return this.memberModel
      .findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;

    const result = await this.memberModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }
}
