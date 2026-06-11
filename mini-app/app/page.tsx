'use client'
import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { BottomNav } from '@/components/bottom-nav'
import { AppHeader } from '@/components/AppHeader'
import { EmptyState } from '@/components/EmptyState'
import { useInitData } from '@/hooks/use-init-data'
import { ShieldCheck } from 'lucide-react'

interface Product {
  id: number; name: string; price: string; images?: string | null; stock: number; description?: string | null
}

const CATEGORIES = ['全部', '虚拟账号', '充值卡', '软件授权', '其他']

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
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100dvh' }}>
      <AppHeader title="财神商盟" subtitle="小程序" />

      <div style={{
        paddingTop: 'calc(80px + env(safe-area-inset-top))',
        paddingBottom: 'calc(76px + env(safe-area-inset-bottom) + 16px)',
      }}>

        {/* 绿色店铺信息卡片 */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="green-gradient" style={{
            borderRadius: 28,
            padding: '24px 20px 28px',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 170,
          }}>
            {/* 装饰圆 */}
            <div style={{ position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ position: 'absolute', right: 60, bottom: -70, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
              {/* 店铺图标 */}
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: 'rgba(255,255,255,0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                flexShrink: 0,
              }}>🏪</div>

              {/* 店铺信息 */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20, fontWeight: 800 }}>数字商城</span>
                  <span style={{
                    background: 'rgba(255,255,255,0.25)',
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    fontWeight: 600,
                  }}>
                    <ShieldCheck size={10} strokeWidth={2.5} />
                    已认证
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>精选数字商品 · 自动发货</p>
              </div>
            </div>
          </div>
        </div>

        {/* 商品分类 + 商品列表（白色卡片覆盖在绿色下方） */}
        <div style={{
          margin: '-16px 16px 0',
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          padding: '20px 16px 0',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* 分类标题行 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#10201A' }}>商品分类</span>
            <span style={{ fontSize: 12, color: '#8A9690' }}>共 {products.length} 件好物</span>
          </div>

          {/* 横向分类 */}
          <div className="category-scroll" style={{ marginBottom: 16 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  flexShrink: 0,
                  padding: '7px 16px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: category === cat ? '#2EA66F' : '#F6F6F8',
                  color: category === cat ? '#fff' : '#6B7C73',
                  transition: 'all 0.15s',
                }}
              >{cat}</button>
            ))}
          </div>

          {/* 商品列表 */}
          <div style={{ paddingBottom: 8 }}>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 100, marginBottom: 12, borderRadius: 20 }} />
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
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
