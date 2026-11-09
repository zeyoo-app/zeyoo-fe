import { NextResponse, type NextRequest } from 'next/server';

/**
 * Google's redirect target. The ID token arrives in the URL fragment, which the
 * server never sees; browsers carry the fragment through this redirect, so the
 * client page can read it.
 *
 * The redirect uses a relative Location so the browser resolves it against the
 * public host it is already on. Building an absolute URL from the request origin
 * leaked the server's internal origin (e.g. https://localhost:10000 behind a
 * proxy) into a browser-facing redirect, stranding users on localhost.
 */
export function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get('error');
  const location = error ? `/google-callback?error=${encodeURIComponent(error)}` : '/google-callback';
  return new NextResponse(null, { status: 302, headers: { Location: location } });
}
