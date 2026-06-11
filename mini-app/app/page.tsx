'use client'
import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/product-card'
import { BottomNav } from '@/components/bottom-nav'
import { AppHeader } from '@/components/AppHeader'
import { EmptyState } from '@/components/EmptyState'
import { useInitData } from '@/hooks/use-init-data'
import Link from 'next/link'

interface Product {
  id: number; name: string; price: string; images?: string | null; stock: number; description?: string | null
}

const CATEGORIES = ['全部', '充值', '游戏', '软件', '其他']

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
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100vh' }}>
      <AppHeader />

      {/* 店铺头部绿色卡片 */}
      <div style={{ padding: '20px 20px 0' }}>
        <div className="green-gradient" style={{
          borderRadius: 28, padding: '24px 20px', color: '#fff', marginBottom: 0,
          minHeight: 160, display: 'flex', alignItems: 'center', gap: 18,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* 装饰圆 */}
          <div style={{
            position: 'absolute', right: -30, top: -30,
            width: 130, height: 130, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />
          <div style={{
            position: 'absolute', right: 30, bottom: -40,
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />

          {/* 店铺图标 */}
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, flexShrink: 0,
          }}>🏪</div>

          {/* 店铺信息 */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.5 }}>数字商城</span>
              <span style={{
                background: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 600,
                padding: '2px 8px', borderRadius: 999,
              }}>已认证</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>精选数字商品 · 自动发货</p>
          </div>
        </div>

        {/* 分类 + 商品列表白色卡片，覆盖在绿色卡片下方 */}
        <div style={{
          background: '#fff', borderRadius: 24,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          marginTop: -20, paddingTop: 20, paddingBottom: 8,
        }}>
          {/* 分类标题行 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#10201A' }}>商品分类</span>
            <span style={{ fontSize: 12, color: '#8A9690' }}>共 {products.length} 件好物</span>
          </div>

          {/* 分类横向滚动 */}
          <div className="category-scroll" style={{ padding: '0 16px 14px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  flexShrink: 0, padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: category === cat ? '#2EA66F' : '#F6F6F8',
                  color: category === cat ? '#fff' : '#6B7C73',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      <div style={{ padding: '12px 20px', paddingBottom: 'calc(76px + env(safe-area-inset-bottom) + 16px)' }}>
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 96, marginBottom: 12 }} />
          ))
        ) : products.length === 0 ? (
          <EmptyState
            icon="📦"
            title="暂无商品"
            description="商家还没有上架商品，敬请期待"
          />
        ) : (
          products.map(p => <ProductCard key={p.id} product={p} />)
        )}
      </div>

      <BottomNav />
    </div>
  )
}
