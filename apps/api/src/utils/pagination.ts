/**
 * Calculate pagination metadata
 */
export const calculatePagination = (params: {
  page: number;
  limit: number;
  total: number;
}) => {
  const { page, limit, total } = params;
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
};

/**
 * Calculate skip value for database pagination
 */
export const calculateSkip = (page: number, limit: number) => {
  return (page - 1) * limit;
};
