export default function PrivacyPage() {
  return (
    <div className="min-h-full bg-gray-50 px-5 py-10 sm:max-w-xl sm:mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-green-700 mb-3">1. 事業者情報</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          本サービス「割引マップ」（以下「当サービス」）は、個人が運営するウェブアプリケーションです。<br />
          お問い合わせ：<a href="mailto:takumi611tt@gmail.com" className="text-green-700 underline">takumi611tt@gmail.com</a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-green-700 mb-3">2. 取得する情報</h2>
        <ul className="text-sm text-gray-700 leading-relaxed list-disc list-inside space-y-1">
          <li>投稿内容（店舗名・割引情報・位置情報）</li>
          <li>ニックネーム（任意入力）</li>
          <li>位置情報（地域選択に使用・ブラウザのGeolocation API経由）</li>
          <li>アクセスログ（IPアドレス、ブラウザ情報等）</li>
          <li>Cookie・広告識別情報</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-green-700 mb-3">3. Firebaseの使用</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          当サービスはGoogleのFirebaseを使用してデータを管理しています。投稿された情報はFirestoreに保存され、他のユーザーと共有されます。Firebaseのプライバシーポリシーは<a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-green-700 underline">こちら</a>をご確認ください。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-green-700 mb-3">4. 広告（Google AdSense）</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          当サービスはGoogle AdSenseを使用しており、Googleおよびそのパートナーがユーザーの興味に基づいた広告を表示するためにCookieを使用することがあります。詳細は<a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-green-700 underline">Googleの広告ポリシー</a>をご確認ください。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-green-700 mb-3">5. 第三者への提供</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          法令に基づく場合を除き、取得した情報を第三者に提供することはありません。なお、投稿内容は当サービス内で公開されます。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-green-700 mb-3">6. お問い合わせ</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          本ポリシーに関するお問い合わせは <a href="mailto:takumi611tt@gmail.com" className="text-green-700 underline">takumi611tt@gmail.com</a> までご連絡ください。
        </p>
      </section>

      <p className="text-xs text-gray-400 mt-10">最終更新：2026年5月</p>
    </div>
  )
}
