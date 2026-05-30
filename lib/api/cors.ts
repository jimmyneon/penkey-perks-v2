/**
 * CORS configuration for Perks integration endpoints
 * Restricts access to POS app only
 */

const allowedOrigins = [
  process.env.NEXT_PUBLIC_POS_URL,
  'https://pos.penkey.com', // Production POS URL
  'https://penkey-pos.vercel.app', // Vercel deployment
  'http://localhost:3001', // Local development
].filter(Boolean) as string[];

/**
 * Check if origin matches allowed patterns
 */
function isOriginAllowedPattern(origin: string): boolean {
  // Allow exact matches
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Allow Vercel preview/production URLs for POS app
  if (origin.includes('notloyverse-pos') && origin.includes('.vercel.app')) {
    return true;
  }
  
  return false;
}

/**
 * Get CORS headers based on request origin
 * Only allows requests from whitelisted POS domains
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && isOriginAllowedPattern(origin);
  
  if (!isAllowed && origin) {
    console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
  }
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  return origin ? allowedOrigins.includes(origin) : false;
}
