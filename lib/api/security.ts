import { NextRequest, NextResponse } from 'next/server';

/**
 * Security utilities for Perks integration endpoints
 */

/**
 * Enforce HTTPS in production
 * Returns true if request is secure or in development
 */
export function enforceHTTPS(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'production') {
    const protocol = request.headers.get('x-forwarded-proto');
    if (protocol !== 'https') {
      console.warn('[Security] HTTPS required but request used HTTP');
      return false;
    }
  }
  return true; // Allow HTTP in development
}

/**
 * Returns HTTPS required error response
 */
export function httpsRequiredResponse(corsHeaders: Record<string, string>) {
  return NextResponse.json(
    { 
      error: 'Forbidden',
      message: 'HTTPS required for this endpoint'
    },
    { status: 403, headers: corsHeaders }
  );
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Sanitize error messages for production
 * Prevents leaking sensitive information
 */
export function sanitizeError(error: any): string {
  if (process.env.NODE_ENV === 'production') {
    return 'Internal server error';
  }
  return error?.message || 'Unknown error';
}
