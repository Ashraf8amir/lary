import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsRepository } from './repositories/products.repository';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductsChatService } from './services/products-chat.service';
import { ProductsService } from './services/products.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])],
  providers: [ProductsRepository, ProductsChatService, ProductsService],
  exports: [ProductsService, ProductsChatService],
})
export class ProductsModule {}
