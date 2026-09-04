import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model } from 'mongoose';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(data: CreateUserDto): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!isValidObjectId(id)) return null;

    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const normalizedEmail = email.toLowerCase().trim();

    return this.userModel.findOne({ email: normalizedEmail }).exec();
  }

  async update(id: string, data: UpdateUserDto): Promise<UserDocument | null> {
    if (!isValidObjectId(id)) return null;

    return this.userModel
      .findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true })
      .exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();

    return (await this.userModel.exists({ email: normalizedEmail })) !== null;
  }

  async softDelete(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;

    const result = await this.userModel
      .updateOne({ _id: id }, { $set: { isDeleted: true, deletedAt: new Date() } })
      .exec();

    return result.modifiedCount > 0;
  }

  async restore(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;

    const result = await this.userModel
      .updateOne({ _id: id, isDeleted: true }, { $set: { isDeleted: false, deletedAt: null } })
      .exec();

    return result.modifiedCount > 0;
  }

  async findOrCreateMerchantUser(data: {
    email: string;
    fullName?: string;
    mobile?: string;
  }): Promise<UserDocument> {
    const normalizedEmail = data.email.toLowerCase().trim();

    return this.userModel
      .findOneAndUpdate(
        { email: normalizedEmail },
        {
          $setOnInsert: {
            email: normalizedEmail,
            fullName: data.fullName?.trim() || '',
            mobile: data.mobile?.trim(),
          },
        },
        {
          returnDocument: 'after',
          upsert: true,
          runValidators: true,
        },
      )
      .exec();
  }
}
