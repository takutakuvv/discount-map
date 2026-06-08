import { NextRequest, NextResponse } from 'next/server';

const CANONICAL_HOST = 'www.waribiki-map.com';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  if (host !== CANONICAL_HOST) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, { status: 301 });
  }
}

export const config = {
  matcher: '/:path*',
};
