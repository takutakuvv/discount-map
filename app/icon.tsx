import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          {/* マップピン */}
          <path d="M16 2C10.477 2 6 6.477 6 12c0 7.5 10 19 10 19s10-11.5 10-19c0-5.523-4.477-10-10-10z" fill="#16a34a"/>
          {/* 内側の白い円 */}
          <circle cx="16" cy="12" r="6.5" fill="white"/>
          {/* ¥マーク */}
          <line x1="13" y1="8.5" x2="16" y2="12.5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="19" y1="8.5" x2="16" y2="12.5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="16" y1="12.5" x2="16" y2="17.5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="13" y1="14" x2="19" y2="14" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="13" y1="16" x2="19" y2="16" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    ),
    { ...size }
  )
}
