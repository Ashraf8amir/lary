import { PaginationMetadata, ResponseEnvelope } from '../interfaces/api-response.interface';

export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): ResponseEnvelope<T[]> {
  const totalPages = Math.ceil(total / limit) || 1;

  const pagination: PaginationMetadata = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  return {
    data,
    metadata: { pagination },
  };
}
