import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoresRepository } from './repositories/stores.repository';
import { Store, StoreSchema } from './schemas/store.schema';
import { StoresService } from './stores.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Store.name, schema: StoreSchema }])],
  providers: [StoresService, StoresRepository],
  exports: [StoresService],
})
export class StoresModule {}
