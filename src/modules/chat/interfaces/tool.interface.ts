import { ProductCard } from '@modules/products/interfaces/product-card.interface';

export interface LlmToolProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  items?: LlmToolProperty;
  properties?: Record<string, LlmToolProperty>;
  required?: string[];
}

export interface LlmToolParameterSchema {
  type: 'object';
  properties: Record<string, LlmToolProperty>;
  description?: string;
  required?: string[];
}

export interface LlmTool {
  name: string;
  description: string;
  parameters: LlmToolParameterSchema;
}

export interface ToolCallContext {
  storeId: string;
}

export interface ToolExecutionResult {
  forModel: string;
  cards?: ProductCard[];
}
