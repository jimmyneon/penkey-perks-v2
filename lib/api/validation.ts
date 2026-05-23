import { z } from 'zod';

/**
 * Validation schemas for Perks integration API endpoints
 */

export const awardPointsSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID format'),
  points: z.number().int().min(1, 'Points must be at least 1').max(10000, 'Points cannot exceed 10000'),
  receipt_id: z.string().uuid('Invalid receipt ID format'),
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
});

export const customerSearchSchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters').max(100, 'Search query too long'),
  limit: z.number().int().min(1).max(50).optional(),
  store_id: z.string().uuid().optional(),
});

export const nearbyCustomersSchema = z.object({
  store_id: z.string().uuid('Invalid store ID format'),
  radius_meters: z.number().int().min(10, 'Radius must be at least 10 meters').max(1000, 'Radius cannot exceed 1000 meters').optional(),
});

export const customerByCodeSchema = z.object({
  code: z.string().min(1, 'Customer code required').max(50, 'Customer code too long'),
});

export const proximityDetectionSchema = z.object({
  store_id: z.string().uuid('Invalid store ID format'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius_meters: z.number().int().min(10).max(1000).optional(),
  include_checked_in: z.boolean().optional(),
  time_window_minutes: z.number().int().min(1).max(1440).optional(), // Max 24 hours
});

/**
 * Validate request data against a schema
 * Returns typed data if valid, or error message if invalid
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return {
      success: false,
      error: errors
    };
  }
  
  return { success: true, data: result.data };
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; error: string } {
  const params: Record<string, any> = {};
  
  searchParams.forEach((value, key) => {
    // Try to parse numbers
    if (!isNaN(Number(value))) {
      params[key] = Number(value);
    } else if (value === 'true' || value === 'false') {
      params[key] = value === 'true';
    } else {
      params[key] = value;
    }
  });
  
  return validateRequest(schema, params);
}
