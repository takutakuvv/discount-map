import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''

  if (host === 'discount-map.vercel.app') {
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex, nofollow">
  <link rel="canonical" href="https://www.waribiki-map.com/">
  <meta http-equiv="refresh" content="0;url=https://www.waribiki-map.com/">
  <title>割引マップ</title>
  <script>window.location.replace('https://www.waribiki-map.com' + window.location.pathname + window.location.search);</script>
</head>
<body>
  <p><a href="https://www.waribiki-map.com/">https://www.waribiki-map.com/</a> へ移動しています...</p>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
