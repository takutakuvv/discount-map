'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Post } from '@/app/page'

function sharePost(post: Post) {
  const expiry = post.expiresAt
    ? `${post.expiresAt.getMonth() + 1}/${post.expiresAt.getDate()}まで`
    : '期限なし'
  const text = `【${post.storeName}】\n${post.discount}\n${post.category} · ${expiry}\n#WaribikiMap\nhttps://www.waribiki-map.com`
  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({ text }).catch(() => {})
  } else {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
  }
}

const CATEGORY_ICONS: Record<string, string> = {
  'スーパー': '🛒', 'コンビニ': '🏪', 'ドラッグストア': '💊',
  '飲食店': '🍽️', 'その他': '📦',
}

const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function clusterIcon(count: number) {
  const size = count > 99 ? 48 : 40
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:#16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:${count > 99 ? 13 : 15}px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25)">${count > 99 ? '99+' : count}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

interface Cluster {
  center: [number, number]
  posts: Post[]
}

function computeClusters(posts: Post[], zoom: number): Cluster[] {
  if (zoom >= 17) return posts.map(p => ({ center: [p.lat, p.lng], posts: [p] }))
  const threshold = 0.05 / Math.pow(2, zoom - 10)
  const processed = new Set<string>()
  const clusters: Cluster[] = []

  for (const post of posts) {
    if (processed.has(post.id)) continue
    const nearby: Post[] = [post]
    processed.add(post.id)
    for (const other of posts) {
      if (processed.has(other.id)) continue
      if (Math.abs(post.lat - other.lat) < threshold && Math.abs(post.lng - other.lng) < threshold) {
        nearby.push(other)
        processed.add(other.id)
      }
    }
    const lat = nearby.reduce((s, p) => s + p.lat, 0) / nearby.length
    const lng = nearby.reduce((s, p) => s + p.lng, 0) / nearby.length
    clusters.push({ center: [lat, lng], posts: nearby })
  }
  return clusters
}

function formatExpiry(expiresAt: Date | null) {
  if (!expiresAt) return ''
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()
  const hours = Math.floor(diff / 1000 / 60 / 60)
  if (hours < 24) return `残り約${hours}時間`
  const days = Math.floor(hours / 24)
  return `残り${days}日`
}

function MapEvents({
  onMapClick,
  onZoomChange,
}: {
  onMapClick: (lat: number, lng: number) => void
  onZoomChange: (zoom: number) => void
}) {
  const map = useMapEvents({
    click(e) { onMapClick(e.latlng.lat, e.latlng.lng) },
    zoomend() { onZoomChange(map.getZoom()) },
  })
  return null
}

interface MapProps {
  posts: Post[]
  center: [number, number]
  zoom?: number
  onMapClick: (lat: number, lng: number) => void
  pendingLat: number | null
  pendingLng: number | null
  currentUserId: string
  onThanks: (postId: string, alreadyThanked: boolean) => void
  onDelete: (postId: string) => void
  bookmarkedIds: string[]
  onBookmark: (post: Post) => void
  onEdit: (post: Post) => void
}

export default function Map({ posts, center, zoom, onMapClick, pendingLat, pendingLng, currentUserId, onThanks, onDelete, bookmarkedIds, onBookmark, onEdit }: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const [currentZoom, setCurrentZoom] = useState(13)

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom ?? mapRef.current.getZoom())
    }
  }, [center, zoom])

  const clusters = computeClusters(posts, currentZoom)

  return (
    <MapContainer center={center} zoom={13} className="w-full h-full" ref={mapRef}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents onMapClick={onMapClick} onZoomChange={setCurrentZoom} />

      {pendingLat !== null && pendingLng !== null && (
        <Marker position={[pendingLat, pendingLng]} icon={selectedIcon} />
      )}

      {clusters.map((cluster, idx) => {
        if (cluster.posts.length > 1) {
          return (
            <Marker
              key={`cluster-${idx}`}
              position={cluster.center}
              icon={clusterIcon(cluster.posts.length)}
              eventHandlers={{
                click() {
                  if (mapRef.current) {
                    mapRef.current.setView(cluster.center, currentZoom + 2)
                  }
                },
              }}
            />
          )
        }

        const post = cluster.posts[0]
        const alreadyThanked = post.thanks.includes(currentUserId)
        const isOwn = post.userId === currentUserId
        const isBookmarked = bookmarkedIds.includes(post.id)
        return (
          <Marker key={post.id} position={[post.lat, post.lng]} icon={storeIcon}>
            <Popup>
              <div className="min-w-[200px] space-y-1.5">
                {post.imageUrl && (
                  <img src={post.imageUrl} alt={post.storeName} className="w-full h-28 object-cover rounded-lg -mt-1 mb-1" />
                )}
                <p className="font-bold text-base">{post.storeName}</p>
                <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {post.category ?? 'その他'}
                </span>
                <p className="text-green-700 font-semibold">{post.discount}</p>
                {post.expiresAt && (
                  <p className="text-xs text-gray-400">{formatExpiry(post.expiresAt)}</p>
                )}
                <p className="text-xs text-gray-400">{post.posterNickname || '匿名'}さんの投稿</p>
                <div className="pt-1 flex items-center gap-2">
                  {isOwn ? (
                    <>
                      <div className="text-xs text-gray-400 flex-1">🙏 {post.thanks.length}件</div>
                      <button
                        onClick={() => sharePost(post)}
                        className="text-gray-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50"
                        title="シェア"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => onEdit(post)}
                        className="text-xs text-blue-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => { if (window.confirm('この投稿を削除しますか？')) onDelete(post.id) }}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                      >
                        削除
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onThanks(post.id, alreadyThanked)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                          alreadyThanked ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-500'
                        }`}
                      >
                        🙏 {post.thanks.length > 0 ? post.thanks.length : 'ありがとう'}
                      </button>
                      <button
                        onClick={() => onBookmark(post)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                          isBookmarked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500 hover:bg-yellow-50 hover:text-yellow-500'
                        }`}
                      >
                        {isBookmarked ? '★ 保存済み' : '☆ 保存'}
                      </button>
                      <button
                        onClick={() => sharePost(post)}
                        className="text-gray-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50"
                        title="シェア"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
