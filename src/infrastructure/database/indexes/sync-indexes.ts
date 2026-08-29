import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppModule } from '../../../app.module';
import { INDEX_DEFINITIONS } from './index-definitions';

async function runIndexBuilder() {
  console.log('[Index Runner] Starting database indexing process...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const connection = app.get<Connection>(getConnectionToken());

    for (const def of INDEX_DEFINITIONS) {
      const collection = connection.collection(def.collection);

      console.log(`Creating index on [${def.collection}]:`, JSON.stringify(def.spec));

      const indexName = await collection.createIndex(def.spec, def.options);
      console.log(`Success: [${indexName}]`);
    }

    console.log('[Index Runner] All indexes created/updated successfully!');
  } catch (error) {
    console.error('[Index Runner] Failed to create indexes:', error);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

runIndexBuilder();
