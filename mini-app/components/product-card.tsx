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
    <Link href={`/product/${product.id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 12,
        transition: 'transform 0.12s',
        WebkitTapHighlightColor: 'transparent',
      }}
        onTouchStart={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)' }}
        onTouchEnd={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
      >
        {/* 商品图片 */}
        <div style={{
          width: 68, height: 68, borderRadius: 16, overflow: 'hidden',
          background: '#F0FAF5', flexShrink: 0, position: 'relative',
        }}>
          {thumb ? (
            <Image src={thumb} alt={product.name} fill style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📦</div>
          )}
          {product.stock === 0 && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16,
            }}>
              <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 999 }}>售罄</span>
            </div>
          )}
        </div>

        {/* 商品信息 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#10201A', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {product.name}
          </p>
          {product.description && (
            <p style={{ fontSize: 12, color: '#8A9690', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {product.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#2EA66F' }}>¥{Number(product.price).toFixed(2)}</span>
            <span style={{ fontSize: 11, color: '#8A9690' }}>库存 {product.stock}</span>
          </div>
        </div>

        {/* 右箭头 */}
        <div style={{ color: '#C8D4CC', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
