'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Post } from '@/app/page'

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

function formatExpiry(expiresAt: Date | null) {
  if (!expiresAt) return ''
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()
  const hours = Math.floor(diff / 1000 / 60 / 60)
  if (hours < 24) return `残り約${hours}時間`
  const days = Math.floor(hours / 24)
  return `残り${days}日`
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface MapProps {
  posts: Post[]
  center: [number, number]
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

export default function Map({ posts, center, onMapClick, pendingLat, pendingLng, currentUserId, onThanks, onDelete, bookmarkedIds, onBookmark, onEdit }: MapProps) {
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, mapRef.current.getZoom())
    }
  }, [center])

  return (
    <MapContainer center={center} zoom={13} className="w-full h-full" ref={mapRef}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />

      {pendingLat !== null && pendingLng !== null && (
        <Marker position={[pendingLat, pendingLng]} icon={selectedIcon} />
      )}

      {posts.map(post => {
        const alreadyThanked = post.thanks.includes(currentUserId)
        const isOwn = post.userId === currentUserId
        const isBookmarked = bookmarkedIds.includes(post.id)
        return (
          <Marker key={post.id} position={[post.lat, post.lng]} icon={storeIcon}>
            <Popup>
              <div className="min-w-[190px] space-y-1.5">
                <p className="font-bold text-base">{post.storeName}</p>
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
