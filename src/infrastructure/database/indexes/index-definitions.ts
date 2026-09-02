import { mongo } from 'mongoose';

export type CreateIndexesOptions = mongo.CreateIndexesOptions;
export type IndexSpecification = mongo.IndexSpecification;

export interface IndexDefinition {
  collection: string;
  spec: IndexSpecification;
  options?: CreateIndexesOptions;
}

export const INDEX_DEFINITIONS: IndexDefinition[] = [];
