import type { LlmTool } from '../interfaces/tool.interface';

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

export const GET_PRODUCT_DETAILS_TOOL: LlmTool = {
  name: 'get_product_details',

  description: `
Get complete details for a SPECIFIC product, including its full description, material/specifications, category, and all available sizes, colors, prices, and stock status.

Use this tool when the user asks follow-up questions about a product that was already mentioned or displayed, such as:
- Availability of sizes or colors: "فيه منه مقاس XL؟", "متوفر منه لون أبيض؟", "وش الألوان والمقاسات المتوفرة؟"
- Product details & specs: "وش خامته؟", "إيش مواصفاته أو مكوناته؟", "ممكن تفاصيل أكثر عن هذا المنتج؟"
- Stock check: "هل باقي منه في المخزون؟"

Do NOT use \`search_products\` for follow-up questions about a specific product; use \`get_product_details\` instead.
`.trim(),

  parameters: {
    type: 'object',

    properties: {
      productName: {
        type: 'string',
        description: `
The exact or closest name of the product being discussed in the conversation context.
Always provide this from the conversation history so the system can locate the product even if variantId is missing.
`.trim(),
      },

      variantId: {
        type: 'string',
        description: `
The variantId of the product if it was previously shown in the conversation (e.g., inside [DISPLAY_CARDS: ...]).
Provide this whenever available in the recent messages for exact lookup.
`.trim(),
      },
    },

    required: ['productName'],
  },
};

export const GET_STORE_CATEGORIES_TOOL: LlmTool = {
  name: 'get_store_categories',

  description: `
Get the list of all available product categories in the store.

Use this tool when:
- The user asks broad questions about what the store sells: "وش عندكم بالمتجر؟", "إيش تبيعون؟", "وش الأقسام الموجودة؟"
- The user has a vague shopping request (e.g., "أبغى هدية", "أبي أجهز للعيد") and you want to see the store's actual categories first before recommending or searching.
`.trim(),

  parameters: {
    type: 'object',
    properties: {},
  },
};

export const ALL_TOOLS: LlmTool[] = [
  SEARCH_PRODUCTS_TOOL,
  GET_PRODUCT_DETAILS_TOOL,
  GET_STORE_CATEGORIES_TOOL,
];
