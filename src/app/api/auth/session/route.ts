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
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
