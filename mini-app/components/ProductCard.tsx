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
  const images = product.images ? (JSON.parse(product.images) as string[]) : []
  const thumb = images[0] ?? null

  return (
    <Link href={`/product/${product.id}`} style={{ textDecoration: 'none', display: 'block' }} className="tap-active">
      <div style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        padding: '14px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 图片 */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 16,
          overflow: 'hidden',
          flexShrink: 0,
          background: '#F0FAF5',
          position: 'relative',
        }}>
          {thumb ? (
            <Image src={thumb} alt={product.name} fill sizes="72px" style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>📦</div>
          )}
          {product.stock === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 10, color: '#fff', fontWeight: 600, background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 999 }}>已售罄</span>
            </div>
          )}
        </div>

        {/* 信息 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#10201A', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {product.name}
          </p>
          {product.description && (
            <p style={{ fontSize: 12, color: '#8A9690', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {product.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: product.description ? 0 : 8 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#2EA66F' }}>¥{Number(product.price).toFixed(2)}</span>
            <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#8A9690' }}>
              <span>库存 {product.stock}</span>
            </div>
          </div>
        </div>

        {/* 右箭头 */}
        <div style={{ color: '#C8D4CC', fontSize: 18, flexShrink: 0 }}>›</div>
      </div>
    </Link>
  )
}
