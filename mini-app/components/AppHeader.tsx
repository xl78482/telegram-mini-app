'use client'
import { useRouter } from 'next/navigation'

interface AppHeaderProps {
  title?: string
  subtitle?: string
  showBack?: boolean
  backLabel?: string
}

export function AppHeader({
  title = '财神商盟',
  subtitle = '小程序',
  showBack = false,
  backLabel = '返回',
}: AppHeaderProps) {
  const router = useRouter()

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* 左侧 */}
        <div style={{ minWidth: 52 }}>
          {showBack ? (
            <button
              className="app-header-btn"
              onClick={() => router.back()}
              style={{ display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
                <path d="M8 1L1.5 7.5L8 14" stroke="#2EA66F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ marginLeft: 2 }}>{backLabel}</span>
            </button>
          ) : (
            <button className="app-header-btn">关闭</button>
          )}
        </div>

        {/* 中间 */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#10201A', lineHeight: 1.25 }}>{title}</p>
          <p style={{ fontSize: 11, color: '#8A9690', marginTop: 2, letterSpacing: 0.3 }}>{subtitle || '小程序'}</p>
        </div>

        {/* 右侧三点 */}
        <div style={{ minWidth: 52, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="app-header-menu-btn" aria-label="更多">
            <span className="app-header-dot" />
            <span className="app-header-dot" />
            <span className="app-header-dot" />
          </button>
        </div>
      </div>
    </header>
  )
}
