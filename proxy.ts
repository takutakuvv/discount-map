import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || ''

  if (host === 'discount-map.vercel.app') {
    const dest = 'https://www.waribiki-map.com' + request.nextUrl.pathname + request.nextUrl.search
    return NextResponse.redirect(dest, { status: 301 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
