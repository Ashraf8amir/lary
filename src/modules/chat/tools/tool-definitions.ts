import type { LlmTool } from '../interfaces/tool.interface';

export const SEARCH_PRODUCTS_TOOL: LlmTool = {
  name: 'search_products',

  description: `
Search the store catalog for NEW products matching the customer's request.
Works across all store types (fashion, coffee & food, perfumes, electronics, etc.).

Do NOT use this tool for follow-up questions about a product that was already shown or mentioned
(sizes, colors, material, stock); use \`get_product_details\` instead.
Do NOT use it for greetings, thanks, or non-shopping questions.
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

      category: {
        type: 'string',
        description:
          'Optional store category name to filter by (especially if known from get_store_categories).',
      },

      maxPrice: {
        type: 'number',
        description:
          'Maximum price budget as a plain number in the store currency, if specified by the customer (e.g., "تحت 200 ريال" → 200).',
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
If the search returns nothing with this filter, retry once without it.
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

Lookup priority: \`variantId\` first (exact match), \`productName\` only as a fallback when no variantId is available.
Do NOT use \`search_products\` for follow-up questions about a specific product; use this tool instead.
`.trim(),

  parameters: {
    type: 'object',

    properties: {
      productName: {
        type: 'string',
        description: `
The exact or closest name of the product being discussed in the conversation context.
Used as a fallback lookup when variantId is missing. Always provide it from the conversation history.
`.trim(),
      },

      variantId: {
        type: 'string',
        description: `
The variantId of the product if it appeared earlier in the conversation (in previous tool results or inside [DISPLAY_CARDS: ...]).
Preferred over productName: provide it whenever available for an exact lookup.
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

Do not call it again if the categories are already known from earlier in the same conversation.
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

Answer strictly from the returned content; never guess a policy that is not stated.
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
