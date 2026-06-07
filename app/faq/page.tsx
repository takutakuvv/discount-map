import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'よくある質問 | Waribiki Map',
  description: 'Waribiki Mapのよくある質問をまとめています。投稿方法・削除方法・ログインについてなど。',
  alternates: { canonical: 'https://www.waribiki-map.com/faq' },
}

const faqs = [
  {
    q: '無料で使えますか？',
    a: 'はい、Waribiki Mapは完全無料でご利用いただけます。会員登録も不要で、地図上のお得情報をすぐに確認できます。投稿するにはアカウントの作成が必要です。',
  },
  {
    q: '投稿するにはどうすればいいですか？',
    a: 'アカウントを作成してログイン後、地図右下の「＋投稿」ボタンをタップしてください。場所を選択し、店舗名・割引内容・カテゴリ・有効期限を入力して投稿できます。写真の添付も可能です。',
  },
  {
    q: '投稿した情報はいつまで表示されますか？',
    a: '有効期限を設定した場合はその日付まで、設定しなかった場合は投稿から1週間後に自動的に非表示になります。',
  },
  {
    q: '投稿を削除・編集できますか？',
    a: 'はい、自分が投稿した情報は「投稿一覧」画面から編集・削除できます。',
  },
  {
    q: 'どのカテゴリに投稿できますか？',
    a: 'スーパー・コンビニ・ドラッグストア・飲食店・その他の5カテゴリに対応しています。',
  },
  {
    q: '地図上にピンが表示されないのですが？',
    a: '選択中の地域に投稿がない場合はピンが表示されません。地図上部の地域選択から、お住まいの都道府県を選択してみてください。',
  },
  {
    q: 'ありがとうボタンとは何ですか？',
    a: '役に立ったお得情報に感謝を伝える機能です。ありがとうの数が多い投稿は信頼性の高い情報として参考にできます。',
  },
  {
    q: 'アカウントを削除したいのですが？',
    a: 'アカウント画面の設定からアカウント削除が行えます。削除するとすべての投稿データも削除されます。',
  },
  {
    q: 'iOSアプリはありますか？',
    a: 'はい、App StoreにてiOS版アプリ「Waribiki Map」を公開しています。',
  },
  {
    q: '不適切な投稿を見つけた場合はどうすればいいですか？',
    a: '投稿カードのメニューから報告できます。運営が確認後、対応いたします。',
  },
]

export default function FaqPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#1a1a1a' }}>
      <Link href="/" style={{ color: '#16a34a', fontSize: 14, textDecoration: 'none' }}>← ホームに戻る</Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 24, marginBottom: 8, color: '#15803d' }}>
        よくある質問
      </h1>
      <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 40 }}>
        Waribiki Mapに関するよくあるご質問をまとめています。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {faqs.map((faq, i) => (
          <div key={i} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#111827' }}>
              Q. {faq.q}
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: '#4b5563', margin: 0 }}>
              {faq.a}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 16, fontSize: 13, color: '#9ca3af' }}>
        <Link href="/about" style={{ color: '#16a34a', textDecoration: 'none' }}>Waribiki Mapとは</Link>
        <Link href="/privacy" style={{ color: '#16a34a', textDecoration: 'none' }}>プライバシーポリシー</Link>
      </div>
    </main>
  )
}
