import { z } from 'zod';

// ============================================
// Error Response Schemas
// ============================================

/**
 * Generic error message schema for Zod validation errors
 * @example { message: "Validation failed" }
 */
export const ZOD_ERROR_MESSAGE_SCHEMA = z.object({
  message: z.string(),
});

/**
 * Standard error message schema for HTTP error responses
 * Used in handler response schemas (400, 404, 500, etc.)
 * @example { message: "Resource not found" }
 */
export const ERROR_MESSAGE_SCHEMA = z.object({
  message: z.string(),
});

// ============================================
// Pagination Schemas
// ============================================

/**
 * Pagination query parameters schema
 * @example { page: 1, limit: 10 }
 */
export const PAGINATION_QUERY_SCHEMA = z.object({
  page: z.coerce.number().int().positive().max(10000).default(1),
  limit: z.coerce.number().int().positive().max(10000).default(10),
});

/**
 * Pagination metadata response schema
 * @example { page: 1, limit: 10, total: 100, totalPages: 10, hasNext: true, hasPrev: false }
 */
export const PAGINATION_RESPONSE_SCHEMA = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

// ============================================
// ID & Identifier Schemas
// ============================================

/**
 * CUID identifier schema (common ID format in Prisma)
 * @example { id: "ckj1k2j3k4j5k6j7k8j9k0" }
 */
export const ID_PARAM_SCHEMA = z.object({
  id: z.string().trim().min(1),
});

/**
 * Multiple IDs schema for batch operations
 * @example { ids: ["id1", "id2", "id3"] }
 */
export const IDS_BODY_SCHEMA = z.object({
  ids: z.array(z.string().trim().min(1)).min(1),
});

// ============================================
// Common Field Schemas
// ============================================

/**
 * ISO 8601 date string schema
 * @example "2026-01-30T10:30:00.000Z"
 */
export const ISO_DATE_STRING_SCHEMA = z.iso.datetime();

/**
 * Optional ISO 8601 date string schema
 * @example "2026-01-30T10:30:00.000Z" | null
 */
export const OPTIONAL_ISO_DATE_STRING_SCHEMA = z.iso.datetime().nullable();

/**
 * Email validation schema
 * @example "user@example.com"
 */
export const EMAIL_SCHEMA = z.email().trim().toLowerCase();

/**
 * Thai mobile number schema (10 digits starting with 0)
 * @example "0812345678"
 */
export const THAI_MOBILE_NUMBER_SCHEMA = z
  .string()
  .trim()
  .regex(/^0[0-9]{9}$/, 'Invalid Thai mobile number format');

/**
 * Boolean string query parameter schema
 * Converts "true"/"false" strings to boolean
 * @example "true" -> true, "false" -> false
 */
export const BOOLEAN_STRING_SCHEMA = z
  .enum(['true', 'false'])
  .transform(val => val === 'true');
