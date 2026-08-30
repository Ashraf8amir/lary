export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface ApiResponseMetadata {
  pagination?: PaginationMetadata;
  [key: string]: unknown;
}

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  metadata?: ApiResponseMetadata;
  timestamp: string;
}

export interface ResponseEnvelope<T = any> {
  data: T;
  metadata?: ApiResponseMetadata;
}

export function isResponseEnvelope<T>(value: unknown): value is ResponseEnvelope<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'metadata' in value &&
    typeof (value as Record<string, any>).metadata === 'object'
  );
}
