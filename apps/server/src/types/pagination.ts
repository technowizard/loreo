/**
 * Pagination types for cursor-based pagination system
 */

export interface CursorData {
  createdAt: string; // ISO timestamp
  id: string; // UUID for uniqueness
}

/**
 * Pagination options for cursor-based queries
 */
export interface CursorPaginationOptions {
  limit?: number;
  cursor?: string;
  orderBy?: 'createdAt' | 'lastReadAt' | 'readingTime' | 'readingProgress' | 'title';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Pagination result metadata
 */
export interface PaginationMetadata {
  hasMore: boolean;
  hasPrevious?: boolean;
  nextCursor?: string;
  previousCursor?: string;
  limit: number;
  total?: number;
  totalReturned: number;
}

/**
 * Complete paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Legacy offset pagination options (for reference during migration)
 */
export interface OffsetPaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'lastReadAt' | 'readingTime' | 'readingProgress' | 'title';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Cursor data structure for database queries
 */
export interface QueryCursor {
  createdAt: string;
  id: string;
}

/**
 * Pagination query builder options
 */
export interface PaginationQueryBuilder {
  userId: string;
  limit: number;
  cursor?: QueryCursor;
  orderBy: string;
  orderDirection: 'asc' | 'desc';
}

/**
 * Search filters for links
 */
export interface LinkSearchFilters {
  hasHighlights?: boolean;
  isArchived?: boolean;
  isFavorite?: boolean;
  isRead?: boolean;
  priority?: string;
  processingStatus?: string;
  readLength?: string;
  tagGroups?: string[];
  tagNames?: string[];
}

/**
 * Enhanced search options with cursor support
 */
export interface LinkSearchOptions extends CursorPaginationOptions {
  searchQuery?: string;
  filters?: LinkSearchFilters;
}

/**
 * Database query result with cursor support
 */
export interface CursorQueryResult<T> {
  items: T[];
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Pagination validation result
 */
export interface PaginationValidation {
  isValid: boolean;
  error?: string;
  sanitized?: CursorPaginationOptions;
}
