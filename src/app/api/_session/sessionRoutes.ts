import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Route handlers that keep a rotating refresh token in an httpOnly cookie. The app
 * and the back office each get their own cookie and upstream auth endpoints, so the
 * two sessions never touch each other.
 */
interface SessionConfig {
  cookie: string;
  /** Backend path that rotates the refresh token, e.g. `/auth/refresh`. */
  refreshPath: string;
  /** Backend path that revokes the refresh token, e.g. `/auth/logout`. */
  logoutPath: string;
}

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function apiBaseUrl(): string | undefined {
  return (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL)?.replace(/\/$/, '');
}

function setRefreshCookie(response: NextResponse, cookie: string, refreshToken: string): void {
  response.cookies.set(cookie, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

function clearRefreshCookie(response: NextResponse, cookie: string): void {
  response.cookies.set(cookie, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export function refreshRoute({ cookie, refreshPath }: SessionConfig) {
  return async function POST() {
    const refreshToken = (await cookies()).get(cookie)?.value;
    if (!refreshToken) return NextResponse.json({ message: 'No session.' }, { status: 401 });

    const baseUrl = apiBaseUrl();
    if (!baseUrl) return NextResponse.json({ message: 'API_BASE_URL is not configured.' }, { status: 500 });

    const upstream = await fetch(`${baseUrl}${refreshPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const response = NextResponse.json({ message: 'Session expired.' }, { status: 401 });
      clearRefreshCookie(response, cookie);
      return response;
    }

    const tokens = (await upstream.json()) as { accessToken: string; refreshToken: string };
    const response = NextResponse.json({ accessToken: tokens.accessToken });
    setRefreshCookie(response, cookie, tokens.refreshToken);
    return response;
  };
}

export function sessionRoutes({ cookie, logoutPath }: SessionConfig) {
  async function POST(request: Request) {
    const { refreshToken } = (await request.json()) as { refreshToken?: string };
    if (!refreshToken) return NextResponse.json({ message: 'Refresh token is required.' }, { status: 400 });

    const response = new NextResponse(null, { status: 204 });
    setRefreshCookie(response, cookie, refreshToken);
    return response;
  }

  async function DELETE() {
    // Revoke the refresh token server-side so a copied cookie cannot be replayed.
    const refreshToken = (await cookies()).get(cookie)?.value;
    const baseUrl = apiBaseUrl();
    if (refreshToken && baseUrl) {
      await fetch(`${baseUrl}${logoutPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      }).catch(() => undefined);
    }

    const response = new NextResponse(null, { status: 204 });
    clearRefreshCookie(response, cookie);
    return response;
  }

  return { POST, DELETE };
}

export const APP_SESSION: SessionConfig = {
  cookie: 'zeyoo.refresh',
  refreshPath: '/auth/refresh',
  logoutPath: '/auth/logout',
};

export const STAFF_SESSION: SessionConfig = {
  cookie: 'zeyoo.staff-refresh',
  refreshPath: '/admin/auth/refresh',
  logoutPath: '/admin/auth/logout',
};
