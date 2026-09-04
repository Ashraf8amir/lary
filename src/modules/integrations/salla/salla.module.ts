import { AuthModule } from '@/modules/auth/auth.module';
import { StoresModule } from '@modules/stores/stores.module';
import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SallaIntegrationController } from './salla-integration.controller';
import { SallaIntegration, SallaIntegrationSchema } from './schemas/salla-integration.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SallaIntegration.name, schema: SallaIntegrationSchema }]),
    UsersModule,
    StoresModule,
    AuthModule,
  ],
  controllers: [SallaIntegrationController],
  providers: [],
  exports: [],
})
export class SallaModule {}
