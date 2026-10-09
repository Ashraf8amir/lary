import { AssistantSettingsService } from '@/modules/assistant-settings/assistant-settings.service';
import { ProductsService } from '@/modules/products/services/products.service';
import { Injectable, Logger } from '@nestjs/common';
import { ToolCallContext, ToolExecutionResult } from '../interfaces/tool.interface';

export enum AssistantToolName {
  SearchProducts = 'search_products',
  GetProductDetails = 'get_product_details',
  GetStoreCategories = 'get_store_categories',
  GetStorePolicies = 'get_store_policies',
}

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
    switch (toolName as AssistantToolName) {
      case AssistantToolName.SearchProducts:
        return this.executeSearchProducts(args, context);

      case AssistantToolName.GetProductDetails:
        return this.executeGetProductDetails(args, context);

      case AssistantToolName.GetStoreCategories:
        return this.executeGetStoreCategories(context);

      case AssistantToolName.GetStorePolicies:
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
    const maxPrice = this.parseNumberArg(args.maxPrice);
    const category = this.parseStringArg(args.category);
    const optionFilter = this.parseStringArg(args.optionFilter);

    if (!query && !category && maxPrice === undefined) {
      return this.buildModelError(
        'At least one of "query", "category", or "maxPrice" must be provided for search_products.',
      );
    }

    try {
      const cards = await this.productsService.searchForChat(context.storeId, {
        query: query ?? category ?? '',
        maxPrice,
        category,
        optionFilter,
      });

      if (cards.length === 0) {
        return {
          forModel: JSON.stringify({
            result: 'No products found matching the criteria.',
          }),
        };
      }

      return {
        forModel: JSON.stringify({
          totalFound: cards.length,
          products: cards.map((card) => ({
            name: card.name,
            variantId: card.variantId,
            price: `${card.priceAmount} ${card.currency}`,
            ...(card.regularPriceAmount
              ? { regularPriceBeforeDiscount: `${card.regularPriceAmount} ${card.currency}` }
              : {}),
            ...(card.promotionTitle ? { promotion: card.promotionTitle } : {}),
            options: card.optionsLabel ?? 'قياسي',
            isAvailable: card.isAvailable,
          })),
        }),
        cards,
      };
    } catch (error) {
      this.logger.error(`Failed to execute product search for store ${context.storeId}`, error);
      return this.buildModelError('Internal search error occurred.');
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
          ...(result.categories?.length ? { categories: result.categories } : {}),
          ...(result.brand ? { brand: result.brand } : {}),
          description: result.description ?? 'No additional description provided.',
          ...(result.promotion ? { promotion: result.promotion } : {}),
          ...(result.rating ? { rating: result.rating } : {}),
          ...(result.calories ? { calories: result.calories } : {}),
          ...(result.weight ? { weight: result.weight } : {}),
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
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed >= 0) {
        return parsed;
      }
    }

    return undefined;
  }
}
