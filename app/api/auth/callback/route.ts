import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const callbackUrl = new URL('/auth/callback', request.url);

  request.nextUrl.searchParams.forEach((value, key) => {
    callbackUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(callbackUrl);
}
