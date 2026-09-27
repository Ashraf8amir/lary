import { ProductCard } from '@modules/products/interfaces/product-card.interface';
import { ProductsService } from '@modules/products/products.service';
import { Injectable, Logger } from '@nestjs/common';
import { ToolCallContext } from './tool-call-context.interface';

export interface ToolExecutionResult {
  forModel: string;
  cards?: ProductCard[];
}

@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(private readonly productsService: ProductsService) {}

  async execute(
    toolName: string,
    args: Record<string, unknown>,
    context: ToolCallContext,
  ): Promise<ToolExecutionResult> {
    switch (toolName) {
      case 'search_products':
        return this.executeSearchProducts(args, context);

      default:
        this.logger.warn(`Unknown tool requested by model: ${toolName}`);
        return { forModel: JSON.stringify({ error: `Tool ${toolName} is not available.` }) };
    }
  }

  private async executeSearchProducts(
    args: Record<string, unknown>,
    context: ToolCallContext,
  ): Promise<ToolExecutionResult> {
    const query = this.parseStringArg(args.query);

    if (!query) {
      return { forModel: JSON.stringify({ error: 'No valid search query provided.' }) };
    }

    const color = this.parseStringArg(args.color);
    const size = this.parseStringArg(args.size);
    const maxPrice = this.parseNumberArg(args.maxPrice);

    try {
      const cards = await this.productsService.searchForChat(context.storeId, {
        query,
        color,
        size,
        maxPrice,
      });

      if (cards.length === 0) {
        return { forModel: JSON.stringify({ result: 'No products matched the search criteria.' }) };
      }

      return {
        forModel: JSON.stringify(this.buildModelPayload(cards)),
        cards,
      };
    } catch (error) {
      this.logger.error(`Error occurred while searching for products: ${error}`);
      return { forModel: JSON.stringify({ error: 'Internal system error occurred.' }) };
    }
  }

  private parseStringArg(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private parseNumberArg(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return undefined;
    }
    return value;
  }

  private buildModelPayload(cards: ProductCard[]) {
    return {
      totalFound: cards.length,
      products: cards.map((card) => ({
        name: card.name,
        options: card.optionsLabel || 'N/A',
        price: `${card.priceAmount} ${card.currency}`,
        isAvailable: card.isAvailable,
      })),
    };
  }
}
