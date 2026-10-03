import { ProductCard } from '@modules/products/interfaces/product-card.interface';
import { ProductsService } from '@modules/products/products.service';
import { Injectable, Logger } from '@nestjs/common';

import { ToolCallContext, ToolExecutionResult } from '../interfaces/tool.interface';

@Injectable()
export class ToolExecutor {
  private readonly logger = new Logger(ToolExecutor.name);

  constructor(private readonly productsService: ProductsService) {}

  async execute(
    toolName: string,
    args: Record<string, unknown>,
    context: ToolCallContext,
  ): Promise<ToolExecutionResult> {
    switch (toolName) {
      case 'search_products':
        return this.executeSearchProducts(args, context);

      case 'get_product_variants':
        return this.executeGetProductVariants(args, context);

      default:
        return this.handleUnknownTool(toolName);
    }
  }

  private async executeSearchProducts(
    args: Record<string, unknown>,
    context: ToolCallContext,
  ): Promise<ToolExecutionResult> {
    const query = this.parseStringArg(args.query);

    if (!query) {
      return this.buildModelError('No valid search query provided.');
    }

    const searchOptions = {
      query,
      color: this.parseStringArg(args.color),
      size: this.parseStringArg(args.size),
      maxPrice: this.parseNumberArg(args.maxPrice),
    };

    try {
      const cards = await this.productsService.searchForChat(context.storeId, searchOptions);

      if (cards.length === 0) {
        return {
          forModel: JSON.stringify({ result: 'No products matched the search criteria.' }),
        };
      }

      return {
        forModel: JSON.stringify(this.buildProductSearchPayload(cards)),
        cards,
      };
    } catch (error) {
      this.logger.error(`Failed to search products for store ${context.storeId}`, error);

      return this.buildModelError('Internal system error occurred.');
    }
  }

  private async executeGetProductVariants(
    args: Record<string, unknown>,
    context: ToolCallContext,
  ): Promise<ToolExecutionResult> {
    const variantId = this.parseStringArg(args.variantId);
    const productName = this.parseStringArg(args.productName);

    if (!variantId && !productName) {
      return this.buildModelError('Either variantId or productName must be provided.');
    }

    try {
      const result = await this.productsService.getProductVariantsForChat(context.storeId, {
        variantId,
        productName,
      });

      if (!result) {
        return {
          forModel: JSON.stringify({
            result: 'Product not found in the store catalog.',
          }),
        };
      }

      return {
        forModel: JSON.stringify({
          productName: result.productName,
          hasVariants: result.hasVariants,
          totalVariants: result.variants.length,
          variants: result.variants,
        }),
        cards: result.cards,
      };
    } catch (error) {
      this.logger.error(`Failed to get product variants for store ${context.storeId}`, error);

      return this.buildModelError('Internal system error occurred.');
    }
  }

  private buildProductSearchPayload(cards: ProductCard[]) {
    return {
      totalFound: cards.length,
      products: cards.map((card) => ({
        variantId: card.variantId,
        name: card.name,
        options: card.optionsLabel || 'N/A',
        price: `${card.priceAmount} ${card.currency}`,
        isAvailable: card.isAvailable,
      })),
    };
  }

  private handleUnknownTool(toolName: string): ToolExecutionResult {
    this.logger.warn(`Unknown tool requested by model: ${toolName}`);

    return this.buildModelError(`Tool ${toolName} is not available.`);
  }

  private buildModelError(error: string): ToolExecutionResult {
    return { forModel: JSON.stringify({ error }) };
  }

  private parseStringArg(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalizedValue = value.trim();

    return normalizedValue || undefined;
  }

  private parseNumberArg(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return undefined;
    }

    return value;
  }
}
