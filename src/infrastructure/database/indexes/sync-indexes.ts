import { Logger } from '@nestjs/common';
import mongoose from 'mongoose';
import { INDEX_DEFINITIONS } from './index-definitions';

const logger = new Logger('IndexRunner');

interface MongoServerErrorLike {
  code?: number;
  codeName?: string;
  message?: string;
}

function getDefaultIndexName(spec: Record<string, unknown>): string {
  return Object.entries(spec)
    .map(([key, value]) => `${key}_${String(value)}`)
    .join('_');
}

async function runIndexBuilder() {
  const startTime = Date.now();
  const databaseUri = process.env.DATABASE_URI?.trim();

  if (!databaseUri) {
    logger.error('DATABASE_URI environment variable is missing!');
    process.exit(1);
  }

  const serverSelectionTimeoutMS = Number(process.env.DATABASE_SERVER_SELECTION_TIMEOUT_MS || 5000);

  logger.log('Connecting to MongoDB to build indexes...');

  let exitCode = 0;

  try {
    const mongooseInstance = await mongoose.connect(databaseUri, {
      serverSelectionTimeoutMS: Number.isNaN(serverSelectionTimeoutMS)
        ? 5000
        : serverSelectionTimeoutMS,
      maxPoolSize: 2,
      autoIndex: false,
    });

    const db = mongooseInstance.connection.db;
    if (!db) {
      throw new Error('MongoDB connection established, but db instance is undefined.');
    }

    let successCount = 0;
    let failureCount = 0;

    for (const def of INDEX_DEFINITIONS) {
      const collection = db.collection(def.collection);
      const specString = JSON.stringify(def.spec);

      try {
        logger.log(`Ensuring index on [${def.collection}]: ${specString}`);
        const indexName = await collection.createIndex(def.spec, def.options);
        logger.log(`Verified: [${def.collection}] -> [${indexName}]`);
        successCount++;
      } catch (indexError: unknown) {
        const mongoErr = indexError as MongoServerErrorLike;

        if (mongoErr?.code === 85 || mongoErr?.code === 86) {
          const targetIndexName =
            def.options?.name || getDefaultIndexName(def.spec as Record<string, unknown>);

          try {
            logger.warn(
              `Index conflict detected on [${def.collection}] (${targetIndexName}). Dropping old index and recreating...`,
            );
            await collection.dropIndex(targetIndexName);
            const recreatedName = await collection.createIndex(def.spec, def.options);
            logger.log(`Recreated updated index: [${def.collection}] -> [${recreatedName}]`);
            successCount++;
            continue;
          } catch (recreateError: unknown) {
            failureCount++;
            const recreateMsg =
              recreateError instanceof Error ? recreateError.message : String(recreateError);
            logger.error(
              `Failed to recreate index on [${def.collection}] with spec ${specString}: ${recreateMsg}`,
            );
            continue;
          }
        }

        failureCount++;
        const errMessage = indexError instanceof Error ? indexError.message : String(indexError);
        logger.error(`Failed on [${def.collection}] with spec ${specString}: ${errMessage}`);
      }
    }

    const durationMs = Date.now() - startTime;

    if (failureCount > 0) {
      logger.error(
        `Completed with errors in ${durationMs}ms (Success: ${successCount}, Failed: ${failureCount})`,
      );
      exitCode = 1;
    } else {
      logger.log(`All ${successCount} indexes created/verified successfully in ${durationMs}ms!`);
    }
  } catch (fatalError: unknown) {
    exitCode = 1;
    logger.error('Fatal error during index building process:', fatalError);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.log('Disconnected from MongoDB.');
    }
    process.exit(exitCode);
  }
}

void runIndexBuilder();
