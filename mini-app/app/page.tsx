'use client'
import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { BottomNav } from '@/components/bottom-nav'
import { AppHeader } from '@/components/AppHeader'
import { EmptyState } from '@/components/EmptyState'
import { useInitData } from '@/hooks/use-init-data'

interface Product {
  id: number; name: string; price: string; images?: string | null; stock: number; description?: string | null; soldCount?: number
}

const CATEGORIES = ['全部', '虚拟账号', '充値卡', '软件授权', '其他']

export default function ShopPage() {
  const initData = useInitData()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('全部')

  useEffect(() => {
    if (initData) {
      fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData }) }).catch(() => {})
    }
  }, [initData])

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProducts(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100dvh' }}>
      <AppHeader title="财神商盟" subtitle="小程序" />

      <div className="page-content" style={{ padding: 0, paddingTop: 'calc(80px + env(safe-area-inset-top))' }}>
        {/* 绿色店铺信息卡片 */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="green-gradient" style={{
            borderRadius: 28,
            padding: '22px 20px 28px',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 168,
          }}>
            {/* 装饰圆 */}
            <div style={{ position: 'absolute', right: -40, top: -45, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', right: 50, bottom: -60, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ position: 'absolute', left: -30, bottom: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
              {/* 店铺图标 */}
              <div style={{
                width: 68, height: 68, borderRadius: 20,
                background: 'rgba(255,255,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </div>

              {/* 店铺信息 */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 21, fontWeight: 800 }}>数字商城</span>
                  <span style={{
                    background: 'rgba(255,255,255,0.28)',
                    fontSize: 10, padding: '2px 9px',
                    borderRadius: 999, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    已认证
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>精选数字商品 · 自动发货</p>
              </div>
            </div>
          </div>
        </div>

        {/* 商品分类 + 商品列表（白色卡片覆盖在绿色下方） */}
        <div style={{
          margin: '-16px 16px 0',
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 2px 14px rgba(0,0,0,0.065)',
          padding: '20px 16px 8px',
          position: 'relative',
          zIndex: 1,
          paddingBottom: 'calc(76px + env(safe-area-inset-bottom) + 16px)',
        }}>
          {/* 分类标题行 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#10201A' }}>商品分类</span>
            <span style={{ fontSize: 12, color: '#8A9690' }}>共 {products.length} 件好物</span>
          </div>

          {/* 横向分类 */}
          <div className="category-scroll" style={{ marginBottom: 18 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  flexShrink: 0,
                  padding: '7px 18px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: category === cat ? 700 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  background: category === cat ? '#2EA66F' : '#F2F2F4',
                  color: category === cat ? '#fff' : '#6B7C73',
                  transition: 'all 0.18s',
                }}
              >{cat}</button>
            ))}
          </div>

          {/* 商品列表 */}
          <div>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 100, marginBottom: 10, borderRadius: 20 }} />
              ))
            ) : products.length === 0 ? (
              <EmptyState
                title="暂无商品"
                description="商家还没有上架商品，敬请期待"
              />
            ) : (
              products.map(p => <ProductCard key={p.id} product={p} />)
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
