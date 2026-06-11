'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronLeft, ShoppingCart } from 'lucide-react'
import { useInitData } from '@/hooks/use-init-data'

interface Product {
  id: number; name: string; price: string; description?: string | null
  images?: string | null; stock: number
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const initData = useInitData()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    fetch(`/api/products/${id}`).then(r => r.json()).then(setProduct).finally(() => setLoading(false))
  }, [id])

  const images = product?.images ? JSON.parse(product.images) as string[] : []

  async function handleBuy() {
    if (!initData || !product) return
    setBuying(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
        body: JSON.stringify({ items: [{ productId: product.id, quantity: 1 }] }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error); return }
      router.push(`/orders/${data.id}`)
    } finally {
      setBuying(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
    </div>
  )

  if (!product) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
      <p>商品不存在</p>
      <button onClick={() => router.back()} className="mt-4 text-blue-400">返回</button>
    </div>
  )

  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-[#000]/80 backdrop-blur-md px-4 py-3">
        <button onClick={() => router.back()} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
          <ChevronLeft size={18} />
        </button>
        <span className="font-medium">商品详情</span>
      </div>

      {/* 图片轮播 */}
      <div className="relative aspect-square w-full bg-[#1c1c1e]">
        {images.length > 0 ? (
          <Image src={images[imgIdx]} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">📦</div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setImgIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === imgIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`} />
            ))}
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div className="px-4 pt-4">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold leading-snug pr-2">{product.name}</h2>
          <span className="shrink-0 text-xl font-bold text-blue-400">¥{Number(product.price).toFixed(2)}</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">库存：{product.stock}</p>
        {product.description && (
          <p className="mt-4 text-sm leading-relaxed text-gray-400">{product.description}</p>
        )}
      </div>

      {/* 购买按钮 */}
      <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 p-4">
        <button
          onClick={handleBuy}
          disabled={product.stock === 0 || buying}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 py-4 text-base font-semibold text-white transition-opacity disabled:opacity-50 active:opacity-80"
        >
          <ShoppingCart size={18} />
          {buying ? '处理中...' : product.stock === 0 ? '已售罄' : '立即购买'}
        </button>
      </div>
    </div>
  )
}
