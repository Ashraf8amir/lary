export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export const SUMMARY_PROVIDER = Symbol('SUMMARY_PROVIDER');

export const MAX_TOOL_ROUNDS = 5;

export const SLIDING_WINDOW_LIMIT = 10;

export const SUMMARY_MESSAGE_INTERVAL = 15;

export const CHAT_CACHE_KEYS = {
  SESSION: 'chat:session:',
  SUMMARY: 'chat:summary:',
  SUMMARY_COUNT: 'chat:summary_count:',
} as const;
