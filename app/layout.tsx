import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '割引マップ',
  description: 'スーパーやお店の割引・タイムセール情報をリアルタイムで共有できる口コミマップ。近所のお得情報を地図で確認しよう。',
  verification: { google: '8rdv6-oBxoLXhDcxQa41xRmsPNIYtLRMosa_A3xjWdY' },
  alternates: {
    canonical: 'https://www.waribiki-map.com',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2913908713051662" crossOrigin="anonymous"></script>
      </head>
      <body className="h-full bg-gray-50">
        {children}
        <footer className="py-3 text-center bg-gray-50">
          <a href="/privacy" className="text-xs text-gray-400 hover:text-gray-600">プライバシーポリシー</a>
        </footer>
      </body>
    </html>
  )
}
