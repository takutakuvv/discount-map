import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Waribiki Mapとは | 近くのお得情報をみんなで共有',
  description: 'Waribiki Mapは、スーパーやコンビニなどの割引・タイムセール情報をみんなでリアルタイムに共有できる口コミマップアプリです。',
  alternates: { canonical: 'https://www.waribiki-map.com/about' },
}

export default function AboutPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#1a1a1a' }}>
      <Link href="/" style={{ color: '#16a34a', fontSize: 14, textDecoration: 'none' }}>← ホームに戻る</Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 24, marginBottom: 8, color: '#15803d' }}>
        Waribiki Mapとは
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.8, color: '#444', marginBottom: 32 }}>
        Waribiki Mapは、近くのスーパー・コンビニ・ドラッグストア・飲食店などの
        <strong>割引・タイムセール情報をみんなでリアルタイムに共有できる口コミマップ</strong>です。
        地図上のピンをタップするだけで、今すぐ使えるお得情報を確認できます。
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#15803d' }}>主な特徴</h2>
      <ul style={{ fontSize: 15, lineHeight: 2, paddingLeft: 20, color: '#444', marginBottom: 32 }}>
        <li><strong>リアルタイム共有</strong> — 投稿されたお得情報がすぐに地図に反映されます</li>
        <li><strong>カテゴリ絞り込み</strong> — スーパー・コンビニ・ドラッグストア・飲食店などで絞り込めます</li>
        <li><strong>写真付き投稿</strong> — 値札や棚の写真を添付してわかりやすく共有できます</li>
        <li><strong>有効期限管理</strong> — 期限切れのセール情報は自動的に非表示になります</li>
        <li><strong>ありがとうボタン</strong> — 役に立った情報に感謝を伝えられます</li>
        <li><strong>Xでシェア</strong> — お得情報をSNSで広めることができます</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#15803d' }}>使い方</h2>
      <ol style={{ fontSize: 15, lineHeight: 2, paddingLeft: 20, color: '#444', marginBottom: 32 }}>
        <li>地図を開いて近くのピンを確認する</li>
        <li>ピンをタップして割引内容・期限を確認する</li>
        <li>お得情報を見つけたら「投稿」ボタンで共有する</li>
        <li>役立った情報には「ありがとう」を押す</li>
      </ol>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#15803d' }}>対応地域</h2>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#444', marginBottom: 32 }}>
        日本全国47都道府県に対応しています。地図上部の地域選択から、お住まいの都道府県を選択してください。
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#15803d' }}>アプリについて</h2>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#444', marginBottom: 16 }}>
        Waribiki MapはWebブラウザからご利用いただけるほか、iOSアプリ（App Store）でもご利用いただけます。
        アプリ版ではプッシュ通知など、より快適な機能をお使いいただけます。
      </p>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 16, fontSize: 13, color: '#9ca3af' }}>
        <Link href="/faq" style={{ color: '#16a34a', textDecoration: 'none' }}>よくある質問</Link>
        <Link href="/privacy" style={{ color: '#16a34a', textDecoration: 'none' }}>プライバシーポリシー</Link>
      </div>
    </main>
  )
}
