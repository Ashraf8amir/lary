import { ProductCard } from '@modules/products/interfaces/product-card.interface';
import { ProductsService } from '@modules/products/products.service';
import { Injectable, Logger } from '@nestjs/common';

import { AssistantSettingsService } from '@/modules/assistant-settings/assistant-settings.service';
import { ToolCallContext, ToolExecutionResult } from '../interfaces/tool.interface';

@Injectable()
export class ToolExecutor {
  private readonly logger = new Logger(ToolExecutor.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly assistantSettingsService: AssistantSettingsService,
  ) {}

  async execute(
    toolName: string,
    args: Record<string, unknown>,
    context: ToolCallContext,
  ): Promise<ToolExecutionResult> {
    switch (toolName) {
      case 'search_products':
        return this.executeSearchProducts(args, context);

      case 'get_product_details':
        return this.executeGetProductDetails(args, context);

      case 'get_store_categories':
        return this.executeGetStoreCategories(context);

      case 'get_store_policies':
        return this.executeGetStorePolicies(context);

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

  private async executeGetProductDetails(
    args: Record<string, unknown>,
    context: ToolCallContext,
  ): Promise<ToolExecutionResult> {
    const variantId = this.parseStringArg(args.variantId);
    const productName = this.parseStringArg(args.productName);

    if (!variantId && !productName) {
      return this.buildModelError('Either variantId or productName must be provided.');
    }

    try {
      const result = await this.productsService.getProductDetailsForChat(context.storeId, {
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
          category: result.category ?? 'N/A',
          description: result.description ?? 'No additional description provided.',
          hasVariants: result.hasVariants,
          totalVariants: result.variants.length,
          variants: result.variants,
        }),
        cards: result.cards,
      };
    } catch (error) {
      this.logger.error(`Failed to get product details for store ${context.storeId}`, error);

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

  private async executeGetStorePolicies(context: ToolCallContext): Promise<ToolExecutionResult> {
    try {
      const policies = await this.assistantSettingsService.getPoliciesForChat(context.storeId);

      return {
        forModel: JSON.stringify({
          shippingPolicy: policies.storePolicies.shippingPolicy ?? 'غير محدد في النظام حالياً.',
          returnPolicy: policies.storePolicies.returnPolicy ?? 'غير محدد في النظام حالياً.',
          paymentMethods: policies.storePolicies.paymentMethods ?? 'غير محدد في النظام حالياً.',
          aboutStore: policies.storePolicies.aboutStore ?? 'غير محدد في النظام حالياً.',
          supportContact: policies.supportContact,
          faqs: policies.faqs,
        }),
      };
    } catch (error) {
      this.logger.error(`Failed to get store policies for store ${context.storeId}`, error);

      return this.buildModelError('Internal system error occurred.');
    }
  }

  private async executeGetStoreCategories(context: ToolCallContext): Promise<ToolExecutionResult> {
    try {
      const categories = await this.productsService.getStoreCategoriesForChat(context.storeId);

      if (categories.length === 0) {
        return {
          forModel: JSON.stringify({
            result: 'No specific categories are defined in this store catalog.',
          }),
        };
      }

      return {
        forModel: JSON.stringify({
          totalCategories: categories.length,
          categories,
        }),
      };
    } catch (error) {
      this.logger.error(`Failed to get store categories for store ${context.storeId}`, error);

      return this.buildModelError('Internal system error occurred.');
    }
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
