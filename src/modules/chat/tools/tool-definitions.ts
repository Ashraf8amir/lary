import type { LlmTool } from '../interfaces/tool.interface';

export const SEARCH_PRODUCTS_TOOL: LlmTool = {
  name: 'search_products',

  description: `
Search the store catalog for products matching the customer's request.
Works across all store types (fashion, coffee & food, perfumes, electronics, etc.).
`.trim(),

  parameters: {
    type: 'object',

    properties: {
      query: {
        type: 'string',
        description: `
Core product search keywords in Arabic or English (e.g., "فستان سهرة", "قهوة إثيوبي", "عطر عود", "سماعات بلوتوث").
Do NOT include prices or variant options (like size, weight, color) inside the query string.
`.trim(),
      },

      maxPrice: {
        type: 'number',
        description: 'Maximum price budget if specified by the customer (e.g., "تحت 200 ريال").',
      },

      optionFilter: {
        type: 'string',
        description: `
Optional variant attribute or preference requested by the customer, regardless of the store category.
Examples:
- Fashion: color or size ("أسود", "XL", "أبيض L")
- Coffee/Food: weight or grind/roast ("250 جرام", "حبوب كاملة", "مطحون إسبريسو", "1 كيلو")
- Perfumes/Cosmetics: volume or concentration ("100 مل", "50ml")
- Electronics: storage capacity or color ("256 جيجا", "تيتانيوم")
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

export const GET_STORE_POLICIES_TOOL: LlmTool = {
  name: 'get_store_policies',

  description: `
Get the store's official policies, shipping & delivery details, return & exchange rules, available payment methods (e.g., Tabby, Tamara, Mada, Cash on Delivery), store branches/about info, and frequently asked questions (FAQs).

Use this tool whenever the user asks about:
- Shipping cost, delivery time, or courier companies ("بكم التوصيل؟", "كم ياخذ الشحن؟")
- Return or exchange policy ("فيه استرجاع أو استبدال؟")
- Payment methods or installments ("عندكم تابي أو تمارا؟", "فيه دفع عند الاستلام؟")
- General store inquiries, branches, working hours, or authenticity FAQs.
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
  GET_STORE_POLICIES_TOOL,
];
