'use client'
import { useRouter } from 'next/navigation'

interface AppHeaderProps {
  title?: string
  subtitle?: string
  showBack?: boolean
}

export function AppHeader({ title = '财神商盟', subtitle = '小程序', showBack = false }: AppHeaderProps) {
  const router = useRouter()

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* 左侧 */}
        {showBack ? (
          <button className="app-header-btn" onClick={() => router.back()}>‹ 返回</button>
        ) : (
          <button className="app-header-btn">关闭</button>
        )}

        {/* 中间 */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#10201A', lineHeight: 1.2 }}>{title}</p>
          <p style={{ fontSize: 11, color: '#8A9690', marginTop: 1 }}>{subtitle || '小程序'}</p>
        </div>

        {/* 右侧三点 */}
        <div style={{ minWidth: 48, display: 'flex', justifyContent: 'flex-end' }}>
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
