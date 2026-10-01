import { NextResponse, type NextRequest } from 'next/server';

/**
 * Google's redirect target. The ID token arrives in the URL fragment, which the
 * server never sees; browsers carry the fragment through this redirect, so the
 * client page can read it.
 */
export function GET(request: NextRequest) {
  const target = new URL('/google-callback', request.nextUrl.origin);
  const error = request.nextUrl.searchParams.get('error');
  if (error) target.searchParams.set('error', error);
  return NextResponse.redirect(target);
}
