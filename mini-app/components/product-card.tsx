'use client'
import Image from 'next/image'
import Link from 'next/link'

interface Product {
  id: number
  name: string
  price: string
  images?: string | null
  stock: number
  description?: string | null
}

export function ProductCard({ product }: { product: Product }) {
  const images = product.images ? JSON.parse(product.images) as string[] : []
  const thumb = images[0] ?? null

  return (
    <Link href={`/product/${product.id}`} className="block">
      <div className="overflow-hidden rounded-2xl bg-[#2c2c2e] transition-transform active:scale-95">
        <div className="relative aspect-square w-full bg-[#3a3a3c]">
          {thumb ? (
            <Image src={thumb} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-600">
              <span className="text-4xl">📦</span>
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="rounded-full bg-black/70 px-3 py-1 text-xs text-gray-300">已售罄</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="truncate text-sm font-medium text-white">{product.name}</p>
          <p className="mt-1 text-base font-bold text-blue-400">¥{Number(product.price).toFixed(2)}</p>
        </div>
      </div>
    </Link>
  )
}
