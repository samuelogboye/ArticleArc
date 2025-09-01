import { PaginationQuery } from '../types';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const parsePaginationQuery = (query: PaginationQuery): PaginationParams => {
  let page = 1;
  let limit = 10;

  if (query.page) {
    page = Math.max(1, parseInt(query.page, 10) || 1);
  }

  if (query.limit) {
    limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  }

  if (query.offset) {
    const offset = Math.max(0, parseInt(query.offset, 10) || 0);
    page = Math.floor(offset / limit) + 1;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};