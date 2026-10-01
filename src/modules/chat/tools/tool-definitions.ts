import { LlmTool } from '../interfaces/llm-provider.interface';

export const SEARCH_PRODUCTS_TOOL: LlmTool = {
  name: 'search_products',

  description: `
Search the store catalog when the user wants to find, browse, buy, or get recommendations for products.

Use this tool for both direct and indirect shopping requests.

Direct examples:
- "أبي تيشيرت أسود"
- "أبغى حذاء رياضي"
- "وش عندكم جواتي؟"

Indirect examples:
- "أبغى هدية للوالدة"
- "أبي شي للشتا"
- "وش عندكم حق البر؟"

The user may speak Khaliji Arabic. Normalize obvious dialect or slang
terms when the meaning is clear, but do not guess unclear meanings.

Do not use this tool for general conversation or when the user only
mentions a product without showing shopping intent.

Do not invent product attributes such as color, size, or price.
Only extract filters that are explicitly mentioned or clearly implied.
`.trim(),

  parameters: {
    type: 'object',

    properties: {
      query: {
        type: 'string',
        description: `
The main product or shopping intent extracted from the user's message.

Normalize common Khaliji Arabic terms when the meaning is clear.
Examples:
- "جواتي" -> "حذاء"
- "دريس" -> "فستان"

For indirect shopping requests, convert the intent into a useful
product category when the meaning is clear.
Examples:
- "هدية للوالدة" -> "هدايا نسائية"
- "شي للشتا" -> "ملابس شتوية"
- "حق البر" -> "مستلزمات البر"

Keep the query focused on the product or category being searched.
`.trim(),
      },

      color: {
        type: 'string',
        description: `
The color explicitly mentioned by the user.

Examples:
- "تيشيرت أسود" -> "أسود"
- "حذاء كحلي" -> "كحلي"
- "شنطة عنابي" -> "عنابي"

Return undefined when no color is mentioned.
Do not invent or assume a color.
`.trim(),
      },

      size: {
        type: 'string',
        description: `
The size explicitly mentioned by the user.

Examples:
- "مقاس L" -> "L"
- "مقاس XL" -> "XL"
- "مقاس 42" -> "42"
- "مقاس كبير" -> "كبير"

Return undefined when no size is mentioned.
Do not infer a size from the product or user context.
`.trim(),
      },

      maxPrice: {
        type: 'number',
        description: `
The maximum price or budget explicitly specified by the user.

Examples:
- "ما يتعدى 200 ريال" -> 200
- "بحدود 500" -> 500
- "أبي شيء أقل من 100" -> 100

Return undefined when no price limit is mentioned.
Do not invent or estimate a budget.
`.trim(),
      },
    },

    required: ['query'],
  },
};

export const ALL_TOOLS: LlmTool[] = [SEARCH_PRODUCTS_TOOL];
