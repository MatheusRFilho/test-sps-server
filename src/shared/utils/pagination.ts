import { PaginationQuery, PaginationParams, PaginatedResponse } from "../types";

export function parsePaginationQuery(query: PaginationQuery): PaginationParams {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10))); // Máximo 100 por página
  const offset = (page - 1) * limit;
  const search = query.search?.trim();
  const sortBy = query.sortBy || 'id';
  const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

  return {
    page,
    limit,
    offset,
    search,
    sortBy,
    sortOrder
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);
  
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1
    }
  };
}

export function validateSortField(sortBy: string, allowedFields: string[]): string {
  return allowedFields.includes(sortBy) ? sortBy : allowedFields[0];
}