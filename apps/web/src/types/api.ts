export interface ApiResult<T> {
  result: T;
  message: string;
  status: number;
}

export type BaseEntity = {
  createdAt: string;
  id: string;
  updatedAt: string;
};

export type Entity<T> = {
  [K in keyof T]: T[K];
} & BaseEntity;

export type Pagination = {
  hasMore: boolean;
  limit: number;
  nextCursor?: string;
  totalReturned: number;
};

export type PaginatedResponseOptions<T> = ApiResult<T> & {
  pagination: Pagination;
};
