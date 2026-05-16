import type {
  CursorQueryResult,
  PaginatedResponse,
  PaginationMetadata
} from '@/types/pagination.js';

export function toCursorPaginatedResponse<T>(
  result: CursorQueryResult<T>,
  limit?: number
): PaginatedResponse<T> {
  const pagination: PaginationMetadata = {
    hasMore: result.hasMore,
    limit: limit ?? 50,
    nextCursor: result.nextCursor,
    totalReturned: result.items.length
  };

  return { data: result.items, pagination };
}
