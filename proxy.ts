import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CANONICAL_HOST = 'www.waribiki-map.com'

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || ''

  if (host !== CANONICAL_HOST) {
    const url = request.nextUrl.clone()
    url.protocol = 'https:'
    url.host = CANONICAL_HOST
    return NextResponse.redirect(url, { status: 301 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
