export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginationResult<T> {
  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function validatePaginationParams(
  page?: number | string,
  pageSize?: number | string
): PaginationParams {
  const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page;
  const parsedPageSize = typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize;

  const validPage = parsedPage && parsedPage > 0 ? parsedPage : 1;
  const validPageSize =
    parsedPageSize && parsedPageSize > 0 && parsedPageSize <= 100 ? parsedPageSize : 20;

  return {
    page: validPage,
    pageSize: validPageSize,
  };
}
