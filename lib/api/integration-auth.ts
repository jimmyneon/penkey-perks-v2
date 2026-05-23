import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates API key for integration endpoints
 * Checks Authorization header against PERKS_API_KEY environment variable
 */
export function validateIntegrationAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    console.warn('[IntegrationAuth] Missing Authorization header');
    return false;
  }

  const apiKey = authHeader.replace('Bearer ', '');
  const validKey = process.env.PERKS_API_KEY;

  if (!validKey) {
    console.error('[IntegrationAuth] PERKS_API_KEY not configured in environment');
    return false;
  }

  const isValid = apiKey === validKey;
  
  if (!isValid) {
    console.warn('[IntegrationAuth] Invalid API key provided');
  }

  return isValid;
}

/**
 * Returns unauthorized response with CORS headers
 */
export function unauthorizedResponse(corsHeaders: Record<string, string>) {
  return NextResponse.json(
    { 
      error: 'Unauthorized',
      message: 'Invalid or missing API key'
    },
    { status: 401, headers: corsHeaders }
  );
}
