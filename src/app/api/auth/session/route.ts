import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const COOKIE = 'zeyoo.refresh';

export async function POST(request: Request) {
  const { refreshToken } = (await request.json()) as { refreshToken?: string };
  if (!refreshToken) return NextResponse.json({ message: 'Refresh token is required.' }, { status: 400 });

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  // Revoke the refresh token server-side so a copied cookie cannot be replayed.
  const refreshToken = (await cookies()).get(COOKIE)?.value;
  const baseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (refreshToken && baseUrl) {
    await fetch(`${baseUrl.replace(/\/$/, '')}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    }).catch(() => undefined);
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
