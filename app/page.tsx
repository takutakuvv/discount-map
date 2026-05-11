'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import {
  collection, addDoc, getDocs, query, where, Timestamp, orderBy, limit,
  doc, updateDoc, arrayUnion, arrayRemove, deleteDoc
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

export interface Post {
  id: string
  storeName: string
  discount: string
  lat: number
  lng: number
  region: string
  expiresAt: Date | null
  userId: string
  createdAt: Date
  thanks: string[]
  posterNickname: string
}

const NICKNAME_KEY = 'discount-map-nickname'
const REGION_KEY = 'discount-map-region'
const BOOKMARKS_KEY = 'discount-map-bookmarks'

type MyPageTab = 'posts' | 'bookmarks'

function parsePost(v: Record<string, unknown>, id: string): Post {
  return {
    id,
    storeName: v.storeName as string,
    discount: v.discount as string,
    lat: v.lat as number,
    lng: v.lng as number,
    region: v.region as string,
    expiresAt: v.expiresAt ? new Date(v.expiresAt as string) : null,
    userId: v.userId as string,
    createdAt: new Date(v.createdAt as string),
    thanks: (v.thanks as string[]) ?? [],
    posterNickname: (v.posterNickname as string) ?? '',
  }
}

function loadBookmarks(): Post[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as Record<string, unknown>[]
    return arr.map(v => parsePost(v, v.id as string))
  } catch { return [] }
}

function saveBookmarks(bookmarks: Post[]) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks))
}

function formatDate(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatExpiry(expiresAt: Date | null) {
  if (!expiresAt) return '期限なし'
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()
  const hours = Math.floor(diff / 1000 / 60 / 60)
  if (hours < 24) return `残り約${hours}時間`
  return `残り${Math.floor(hours / 24)}日`
}

const REGIONS = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]

const REGION_CENTERS: Record<string, [number, number]> = {
  '北海道': [43.064, 141.347], '青森県': [40.824, 140.740], '岩手県': [39.703, 141.153],
  '宮城県': [38.269, 140.872], '秋田県': [39.718, 140.102], '山形県': [38.240, 140.363],
  '福島県': [37.750, 140.468], '茨城県': [36.341, 140.447], '栃木県': [36.565, 139.883],
  '群馬県': [36.391, 139.060], '埼玉県': [35.857, 139.649], '千葉県': [35.605, 140.123],
  '東京都': [35.690, 139.692], '神奈川県': [35.448, 139.642], '新潟県': [37.902, 139.023],
  '富山県': [36.695, 137.211], '石川県': [36.594, 136.626], '福井県': [36.065, 136.222],
  '山梨県': [35.664, 138.568], '長野県': [36.651, 138.181], '岐阜県': [35.391, 136.722],
  '静岡県': [34.977, 138.383], '愛知県': [35.180, 136.907], '三重県': [34.730, 136.509],
  '滋賀県': [35.004, 135.869], '京都府': [35.021, 135.756], '大阪府': [34.686, 135.520],
  '兵庫県': [34.691, 135.183], '奈良県': [34.685, 135.833], '和歌山県': [34.226, 135.168],
  '鳥取県': [35.504, 134.238], '島根県': [35.472, 133.051], '岡山県': [34.662, 133.935],
  '広島県': [34.396, 132.459], '山口県': [34.186, 131.471], '徳島県': [34.066, 134.559],
  '香川県': [34.340, 134.043], '愛媛県': [33.842, 132.766], '高知県': [33.560, 133.531],
  '福岡県': [33.607, 130.418], '佐賀県': [33.249, 130.299], '長崎県': [32.745, 129.874],
  '熊本県': [32.790, 130.742], '大分県': [33.238, 131.612], '宮崎県': [31.911, 131.424],
  '鹿児島県': [31.560, 130.558], '沖縄県': [26.212, 127.681],
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [region, setRegion] = useState('東京都')
  const [posts, setPosts] = useState<Post[]>([])
  const [fetching, setFetching] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showRegionPicker, setShowRegionPicker] = useState(false)
  const [showNicknameEditor, setShowNicknameEditor] = useState(false)
  const [showMyPage, setShowMyPage] = useState(false)
  const [myPageTab, setMyPageTab] = useState<MyPageTab>('posts')
  const [myAllPosts, setMyAllPosts] = useState<Post[]>([])
  const [myPostsLoading, setMyPostsLoading] = useState(false)
  const [bookmarks, setBookmarks] = useState<Post[]>([])
  const [nickname, setNickname] = useState('')
  const [nicknameInput, setNicknameInput] = useState('')
  const [pendingLat, setPendingLat] = useState<number | null>(null)
  const [pendingLng, setPendingLng] = useState<number | null>(null)
  const [storeName, setStoreName] = useState('')
  const [discount, setDiscount] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [editStoreName, setEditStoreName] = useState('')
  const [editDiscount, setEditDiscount] = useState('')
  const [editExpiryDate, setEditExpiryDate] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      setAuthLoading(false)
      if (!u) router.push('/login')
    })
    return unsub
  }, [router])

  const fetchPosts = useCallback(async (r: string) => {
    setFetching(true)
    try {
      const now = Timestamp.now()
      const q = query(
        collection(db, 'posts'),
        where('region', '==', r),
        where('expiresAt', '>', now),
        orderBy('expiresAt', 'desc'),
        limit(100)
      )
      const snap = await getDocs(q)
      const data: Post[] = snap.docs.map(d => {
        const v = d.data()
        return {
          id: d.id,
          storeName: v.storeName,
          discount: v.discount,
          lat: v.lat,
          lng: v.lng,
          region: v.region,
          expiresAt: v.expiresAt ? v.expiresAt.toDate() : null,
          userId: v.userId,
          createdAt: v.createdAt.toDate(),
          thanks: v.thanks ?? [],
          posterNickname: v.posterNickname ?? '',
        }
      })
      setPosts(data)
      setLastUpdated(new Date())
    } finally {
      setFetching(false)
    }
  }, [])

  const fetchMyPosts = useCallback(async (uid: string) => {
    setMyPostsLoading(true)
    try {
      const q = query(
        collection(db, 'posts'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const snap = await getDocs(q)
      const data: Post[] = snap.docs.map(d => {
        const v = d.data()
        return {
          id: d.id,
          storeName: v.storeName,
          discount: v.discount,
          lat: v.lat,
          lng: v.lng,
          region: v.region,
          expiresAt: v.expiresAt ? v.expiresAt.toDate() : null,
          userId: v.userId,
          createdAt: v.createdAt.toDate(),
          thanks: v.thanks ?? [],
          posterNickname: v.posterNickname ?? '',
        }
      })
      setMyAllPosts(data)
    } finally {
      setMyPostsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const savedRegion = localStorage.getItem(REGION_KEY) ?? '東京都'
    setRegion(savedRegion)
    setNickname(localStorage.getItem(NICKNAME_KEY) ?? '')
    setBookmarks(loadBookmarks())
    fetchPosts(savedRegion)
  }, [user, fetchPosts])

  async function handleDelete(postId: string) {
    if (!user) return
    await deleteDoc(doc(db, 'posts', postId))
    setPosts(prev => prev.filter(p => p.id !== postId))
    setMyAllPosts(prev => prev.filter(p => p.id !== postId))
  }

  async function handleThanks(postId: string, alreadyThanked: boolean) {
    if (!user) return
    const ref = doc(db, 'posts', postId)
    if (alreadyThanked) {
      await updateDoc(ref, { thanks: arrayRemove(user.uid) })
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, thanks: p.thanks.filter(id => id !== user.uid) } : p))
    } else {
      await updateDoc(ref, { thanks: arrayUnion(user.uid) })
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, thanks: [...p.thanks, user.uid] } : p))
    }
  }

  function handleBookmark(post: Post) {
    const exists = bookmarks.some(b => b.id === post.id)
    const updated = exists
      ? bookmarks.filter(b => b.id !== post.id)
      : [post, ...bookmarks]
    setBookmarks(updated)
    saveBookmarks(updated)
  }

  function handleRemoveBookmark(postId: string) {
    const updated = bookmarks.filter(b => b.id !== postId)
    setBookmarks(updated)
    saveBookmarks(updated)
  }

  const myPosts = posts.filter(p => p.userId === user?.uid)
  const myThanksTotal = myAllPosts.reduce((sum, p) => sum + p.thanks.length, 0)

  function handleLocate() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => alert('現在地を取得できませんでした。位置情報の許可を確認してください。')
    )
  }

  function handleOpenEdit(post: Post) {
    setEditingPost(post)
    setEditStoreName(post.storeName)
    setEditDiscount(post.discount)
    setEditExpiryDate(post.expiresAt ? post.expiresAt.toISOString().split('T')[0] : '')
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingPost) return
    setEditSubmitting(true)
    try {
      let expiresAt: Timestamp
      if (editExpiryDate) {
        expiresAt = Timestamp.fromDate(new Date(editExpiryDate + 'T23:59:59'))
      } else {
        const d = new Date()
        d.setDate(d.getDate() + 7)
        expiresAt = Timestamp.fromDate(d)
      }
      await updateDoc(doc(db, 'posts', editingPost.id), {
        storeName: editStoreName,
        discount: editDiscount,
        expiresAt,
      })
      const updated = { ...editingPost, storeName: editStoreName, discount: editDiscount, expiresAt: expiresAt.toDate() }
      setPosts(prev => prev.map(p => p.id === editingPost.id ? updated : p))
      setMyAllPosts(prev => prev.map(p => p.id === editingPost.id ? updated : p))
      setEditingPost(null)
    } finally {
      setEditSubmitting(false)
    }
  }

  function handleRegionChange(r: string) {
    setRegion(r)
    localStorage.setItem(REGION_KEY, r)
    setShowRegionPicker(false)
    fetchPosts(r)
  }

  function handleSaveNickname() {
    const trimmed = nicknameInput.trim()
    setNickname(trimmed)
    localStorage.setItem(NICKNAME_KEY, trimmed)
    setShowNicknameEditor(false)
  }

  function handleOpenMyPage() {
    setShowMyPage(true)
    if (user) fetchMyPosts(user.uid)
  }

  function handleMapClick(lat: number, lng: number) {
    if (!showForm) return
    setPendingLat(lat)
    setPendingLng(lng)
  }

  function handleOpenForm() {
    setShowForm(true)
    setPendingLat(null)
    setPendingLng(null)
    setStoreName('')
    setDiscount('')
    setExpiryDate('')
  }

  function handleCancelForm() {
    setShowForm(false)
    setPendingLat(null)
    setPendingLng(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || pendingLat === null || pendingLng === null) return
    setSubmitting(true)

    let expiresAt: Timestamp
    if (expiryDate) {
      expiresAt = Timestamp.fromDate(new Date(expiryDate + 'T23:59:59'))
    } else {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      expiresAt = Timestamp.fromDate(d)
    }

    await addDoc(collection(db, 'posts'), {
      storeName, discount, lat: pendingLat, lng: pendingLng,
      region, expiresAt, userId: user.uid,
      posterNickname: nickname || '',
      createdAt: Timestamp.now(),
      thanks: [],
    })

    setSubmitting(false)
    setShowForm(false)
    setPendingLat(null)
    setPendingLng(null)
    setStoreName('')
    setDiscount('')
    setExpiryDate('')
    fetchPosts(region)
  }

  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const mapCenter = (userLocation ?? REGION_CENTERS[region] ?? [35.690, 139.692]) as [number, number]
  const lastUpdatedStr = lastUpdated
    ? `${lastUpdated.getHours()}:${String(lastUpdated.getMinutes()).padStart(2, '0')} 更新`
    : ''
  const bookmarkedIds = bookmarks.map(b => b.id)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2C10.477 2 6 6.477 6 12c0 7.5 10 19 10 19s10-11.5 10-19c0-5.523-4.477-10-10-10z" fill="#16a34a"/>
              <circle cx="16" cy="12" r="6.5" fill="white"/>
              <line x1="13" y1="8.5" x2="16" y2="12.5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="19" y1="8.5" x2="16" y2="12.5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="16" y1="12.5" x2="16" y2="17.5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="13" y1="14" x2="19" y2="14" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="13" y1="16" x2="19" y2="16" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-bold text-gray-900">割引マップ</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRegionPicker(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            </svg>
            {region}
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-500 transition-colors"
            title="使い方"
          >
            ?
          </button>
          <button
            onClick={handleOpenMyPage}
            className="relative flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <span className="hidden sm:inline">マイページ</span>
            {bookmarks.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {bookmarks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setNicknameInput(nickname); setShowNicknameEditor(true) }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100"
          >
            {nickname || '👤'}
          </button>
          <button onClick={() => signOut(auth)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">
            ログアウト
          </button>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <Map
          posts={posts}
          center={mapCenter}
          onMapClick={handleMapClick}
          pendingLat={pendingLat}
          pendingLng={pendingLng}
          currentUserId={user.uid}
          onThanks={handleThanks}
          onDelete={handleDelete}
          bookmarkedIds={bookmarkedIds}
          onBookmark={handleBookmark}
          onEdit={handleOpenEdit}
        />

        {showForm && pendingLat === null && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-full z-[1000] pointer-events-none">
            地図をタップしてお店の場所を選択
          </div>
        )}

        {!showForm && (
          <button
            onClick={handleOpenForm}
            className="absolute bottom-6 right-4 z-[1000] w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        )}

        {!showForm && (
          <div className="absolute bottom-6 left-4 z-[1000] flex flex-col gap-1">
            <div className="bg-white rounded-full shadow px-3 py-1.5 text-xs text-gray-600 font-medium">
              {posts.length}件の割引情報
            </div>
            <button
              onClick={() => fetchPosts(region)}
              disabled={fetching}
              className="bg-white rounded-full shadow px-3 py-1.5 text-xs text-green-600 font-medium hover:bg-green-50 disabled:opacity-50 flex items-center gap-1"
            >
              {fetching ? '読込中...' : `🔄 更新${lastUpdatedStr ? `（${lastUpdatedStr}）` : ''}`}
            </button>
          </div>
        )}

        {!showForm && (
          <button
            onClick={handleLocate}
            className="absolute bottom-24 right-4 z-[1000] w-10 h-10 bg-white hover:bg-gray-50 text-gray-600 rounded-full shadow-lg flex items-center justify-center transition-colors"
            title="現在地へ移動"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"/>
              <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              <circle cx="12" cy="12" r="8" strokeDasharray="2 2"/>
            </svg>
          </button>
        )}
      </div>

      {/* 投稿フォーム（場所選択済み） */}
      {showForm && pendingLat !== null && (
        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 z-10">
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-green-700 font-medium">場所を選択済み ✓</p>
            <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} required
              placeholder="お店の名前（例：イオン渋谷店）"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input type="text" value={discount} onChange={e => setDiscount(e.target.value)} required
              placeholder="割引情報（例：牛肉30%オフ、本日限り）"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <div>
              <label className="text-xs text-gray-500 mb-1 block">有効期限（未入力の場合は1週間後に自動削除）</label>
              <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleCancelForm}
                className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium">
                キャンセル
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                {submitting ? '投稿中...' : '投稿する'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showForm && pendingLat === null && (
        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 z-10">
          <button onClick={handleCancelForm}
            className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium">
            キャンセル
          </button>
        </div>
      )}

      {/* 投稿編集モーダル */}
      {editingPost && (
        <div className="absolute inset-0 bg-black/50 z-[2000] flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">投稿を編集</h2>
              <button onClick={() => setEditingPost(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <input type="text" value={editStoreName} onChange={e => setEditStoreName(e.target.value)} required
                placeholder="お店の名前"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <input type="text" value={editDiscount} onChange={e => setEditDiscount(e.target.value)} required
                placeholder="割引情報"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">有効期限（未入力の場合は1週間後）</label>
                <input type="date" value={editExpiryDate} onChange={e => setEditExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditingPost(null)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium">
                  キャンセル
                </button>
                <button type="submit" disabled={editSubmitting}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                  {editSubmitting ? '保存中...' : '保存する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 使い方モーダル */}
      {showHelp && (
        <div className="absolute inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-base text-gray-900">使い方</h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="p-5 space-y-4 text-sm text-gray-700">
              <div className="space-y-2">
                <p className="font-semibold text-green-700">📍 割引情報を投稿する</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600 text-xs leading-relaxed">
                  <li>右下の <span className="font-bold text-green-600">＋</span> ボタンをタップ</li>
                  <li>地図上でお店の場所をタップ</li>
                  <li>お店の名前・割引情報・有効期限を入力</li>
                  <li>「投稿する」で完了</li>
                </ol>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-blue-600">🔍 割引情報を見る</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 text-xs leading-relaxed">
                  <li>地図のピンをタップすると詳細が表示</li>
                  <li>右上の地域ボタンで表示エリアを切替</li>
                  <li><span className="font-bold">🔄 更新</span>ボタンで最新情報を取得</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-yellow-600">★ 保存・マイページ</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 text-xs leading-relaxed">
                  <li>他の人の投稿を <span className="font-bold">☆ 保存</span> でブックマーク</li>
                  <li>マイページで自分の投稿・保存済みを確認</li>
                  <li>🙏 ありがとうボタンで役立った投稿に感謝</li>
                </ul>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => setShowHelp(false)}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 地域選択モーダル */}
      {showRegionPicker && (
        <div className="absolute inset-0 bg-black/50 z-[2000] flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[70vh] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">地域を選択</h2>
              <button onClick={() => setShowRegionPicker(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4 grid grid-cols-3 gap-2">
              {REGIONS.map(r => (
                <button key={r} onClick={() => handleRegionChange(r)}
                  className={`py-2 px-1 text-sm rounded-lg font-medium transition-colors ${
                    r === region ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ニックネーム編集モーダル */}
      {showNicknameEditor && (
        <div className="absolute inset-0 bg-black/50 z-[2000] flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">ニックネーム設定</h2>
              <button onClick={() => setShowNicknameEditor(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <input type="text" value={nicknameInput} onChange={e => setNicknameInput(e.target.value)}
              placeholder="ニックネーム（任意）" maxLength={20}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <p className="text-xs text-gray-400">投稿時にニックネームが表示されます。未設定の場合は匿名になります。</p>
            <div className="flex gap-2">
              <button onClick={() => setShowNicknameEditor(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium">
                キャンセル
              </button>
              <button onClick={handleSaveNickname}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* マイページパネル */}
      {showMyPage && (
        <div className="absolute inset-0 bg-black/50 z-[2000] flex items-end sm:items-stretch sm:justify-end">
          <div className="bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-none flex flex-col max-h-[85vh] sm:max-h-full">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="font-bold text-gray-900">マイページ</h2>
              <button onClick={() => setShowMyPage(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* タブ */}
            <div className="flex border-b border-gray-200 flex-shrink-0">
              <button
                onClick={() => setMyPageTab('posts')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  myPageTab === 'posts' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                自分の投稿 ({myAllPosts.length})
              </button>
              <button
                onClick={() => setMyPageTab('bookmarks')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  myPageTab === 'bookmarks' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ★ 保存済み ({bookmarks.length})
              </button>
            </div>

            {/* 実績バー */}
            <div className="px-4 py-2 bg-green-50 flex items-center gap-4 text-xs text-gray-600 flex-shrink-0">
              <span>📝 投稿 <b>{myAllPosts.length}</b>件</span>
              <span>🙏 ありがとう <b>{myThanksTotal}</b>件</span>
              <span>★ 保存 <b>{bookmarks.length}</b>件</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* 自分の投稿タブ */}
              {myPageTab === 'posts' && (
                myPostsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : myAllPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm">
                    <span className="text-3xl mb-2">📝</span>
                    まだ投稿がありません
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {myAllPosts.map(post => (
                      <li key={post.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">{post.storeName}</p>
                            <p className="text-xs text-green-700 mt-0.5">{post.discount}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                              <span>{post.region}</span>
                              <span>·</span>
                              <span>{formatExpiry(post.expiresAt)}</span>
                              <span>·</span>
                              <span>🙏 {post.thanks.length}</span>
                            </div>
                            <p className="text-xs text-gray-300 mt-0.5">{formatDate(post.createdAt)}</p>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleOpenEdit(post)}
                              className="text-xs text-blue-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => { if (window.confirm('この投稿を削除しますか？')) handleDelete(post.id) }}
                              className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}

              {/* 保存済みタブ */}
              {myPageTab === 'bookmarks' && (
                bookmarks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm">
                    <span className="text-3xl mb-2">★</span>
                    保存した割引情報がありません
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {bookmarks.map(post => (
                      <li key={post.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">{post.storeName}</p>
                            <p className="text-xs text-green-700 mt-0.5">{post.discount}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                              <span>{post.region}</span>
                              <span>·</span>
                              <span>{formatExpiry(post.expiresAt)}</span>
                              <span>·</span>
                              <span>{post.posterNickname || '匿名'}さん</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveBookmark(post.id)}
                            className="text-xs text-gray-400 hover:text-red-400 px-2 py-1 rounded hover:bg-red-50 flex-shrink-0"
                          >
                            削除
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
