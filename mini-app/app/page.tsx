'use client'
import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/product-card'
import { BottomNav } from '@/components/bottom-nav'
import { useInitData } from '@/hooks/use-init-data'

interface Product {
  id: number; name: string; price: string; images?: string | null; stock: number; description?: string | null
}

export default function ShopPage() {
  const initData = useInitData()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 自动登录
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
    <>
      <div className="sticky top-0 z-10 bg-[#000]/80 backdrop-blur-md px-4 py-4">
        <h1 className="text-xl font-bold">商店</h1>
      </div>
      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-[#2c2c2e]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <span className="text-5xl mb-4">🛍️</span>
            <p>暂无商品</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
      <BottomNav />
    </>
  )
}
