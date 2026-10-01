import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const COOKIE = 'zeyoo.refresh';

export async function POST() {
  const refreshToken = (await cookies()).get(COOKIE)?.value;
  if (!refreshToken) return NextResponse.json({ message: 'No session.' }, { status: 401 });

  const baseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return NextResponse.json({ message: 'API_BASE_URL is not configured.' }, { status: 500 });

  const upstream = await fetch(`${baseUrl.replace(/\/$/, '')}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  if (!upstream.ok) {
    const response = NextResponse.json({ message: 'Session expired.' }, { status: 401 });
    response.cookies.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
    return response;
  }

  const tokens = (await upstream.json()) as { accessToken: string; refreshToken: string };
  const response = NextResponse.json({ accessToken: tokens.accessToken });
  response.cookies.set(COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
