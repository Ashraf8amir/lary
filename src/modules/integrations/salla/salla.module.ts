import { AuthModule } from '@/modules/auth/auth.module';
import { StoresModule } from '@modules/stores/stores.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [StoresModule, AuthModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class SallaModule {}
