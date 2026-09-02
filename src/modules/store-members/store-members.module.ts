import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoresModule } from '../stores/stores.module';
import { UsersModule } from '../users/users.module';
import { StoreMembersRepository } from './repositories/store-members.repository';
import { StoreMember, StoreMemberSchema } from './schemas/store-member.schema';
import { StoreMembersService } from './store-members.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: StoreMember.name, schema: StoreMemberSchema }]),
    UsersModule,
    StoresModule,
  ],
  providers: [StoreMembersService, StoreMembersRepository],
  exports: [StoreMembersService],
})
export class StoreMembersModule {}
