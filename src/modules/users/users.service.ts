import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UsersRepository } from './repositories/users.repository';
import { UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(data: CreateUserDto): Promise<UserDocument> {
    return this.usersRepository.create(data);
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepository.findByEmail(email);
  }

  async update(id: string, data: UpdateUserDto): Promise<UserDocument | null> {
    return this.usersRepository.update(id, data);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.usersRepository.existsByEmail(email);
  }

  async softDelete(id: string): Promise<boolean> {
    return this.usersRepository.softDelete(id);
  }

  async restore(id: string): Promise<boolean> {
    return this.usersRepository.restore(id);
  }

  async findOrCreateMerchantUser(data: {
    email: string;
    fullName?: string;
    mobile?: string;
  }): Promise<UserDocument> {
    return this.usersRepository.findOrCreateMerchantUser(data);
  }
}
