'use client'
import { useRouter, usePathname } from 'next/navigation'
import { X, MoreHorizontal, ChevronLeft } from 'lucide-react'

interface AppHeaderProps {
  title?: string
  subtitle?: string
  showBack?: boolean
  isRoot?: boolean
}

export function AppHeader({ title = '财神商盟', subtitle = '小程序', showBack = false, isRoot = false }: AppHeaderProps) {
  const router = useRouter()

  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      paddingTop: 'env(safe-area-inset-top)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        padding: '0 16px',
      }}>
        {/* 左侧 */}
        <div style={{ width: 56, display: 'flex', alignItems: 'center' }}>
          {showBack ? (
            <button
              onClick={() => router.back()}
              style={{
                display: 'flex', alignItems: 'center', gap: 2,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#2EA66F', fontSize: 15, fontWeight: 600, padding: 0,
              }}
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
              返回
            </button>
          ) : (
            <button
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#6B7C73', fontSize: 15, fontWeight: 500, padding: 0,
              }}
            >
              关闭
            </button>
          )}
        </div>

        {/* 中间标题 */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#10201A', lineHeight: 1.2 }}>{title}</div>
          <div style={{ fontSize: 11, color: '#8A9690', marginTop: 1 }}>{subtitle}</div>
        </div>

        {/* 右侧三点 */}
        <div style={{ width: 56, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#F6F6F8', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6B7C73',
            }}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
