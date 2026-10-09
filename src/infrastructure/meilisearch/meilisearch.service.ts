import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Index, Meilisearch } from 'meilisearch';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private client: Meilisearch;
  private readonly logger = new Logger(MeilisearchService.name);

  constructor() {
    this.client = new Meilisearch({
      host: process.env.MEILI_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILI_MASTER_KEY || 'Lary_Super_Secret_Key_12345',
    });
  }

  async onModuleInit() {
    try {
      await this.client.updateIndex('products', { primaryKey: 'id' });

      const productsIndex = this.client.index('products');

      await productsIndex.updateFilterableAttributes([
        'storeId',
        'status',
        'category',
        'categories',
        'minPrice',
      ]);

      await productsIndex.updateSearchableAttributes([
        'name',
        'categories',
        'category',
        'brand',
        'tags',
        'description',
      ]);

      this.logger.log('Meilisearch indexes initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Meilisearch indexes', error);
    }
  }

  getIndex(indexName: string): Index {
    return this.client.index(indexName);
  }
}
