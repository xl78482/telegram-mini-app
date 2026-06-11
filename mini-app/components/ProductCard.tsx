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
  soldCount?: number
}

export function ProductCard({ product }: { product: Product }) {
  const images = product.images ? (() => { try { return JSON.parse(product.images!) as string[] } catch { return [] } })() : []
  const thumb = images[0] ?? null
  const isSoldOut = product.stock === 0

  return (
    <Link href={`/product/${product.id}`} style={{ textDecoration: 'none', display: 'block' }} className="tap-active">
      <div style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 2px 12px rgba(0,0,0,0.055)',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 10,
        position: 'relative',
        overflow: 'hidden',
        opacity: isSoldOut ? 0.7 : 1,
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
            <Image src={thumb} alt={product.name} fill sizes="72px" style={{ objectFit: 'cover' }} unoptimized />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, color: '#2EA66F',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              </svg>
            </div>
          )}
          {isSoldOut && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontSize: 10, color: '#fff', fontWeight: 700,
                background: 'rgba(0,0,0,0.55)', padding: '2px 7px', borderRadius: 999,
              }}>已售罄</span>
            </div>
          )}
        </div>

        {/* 信息 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 15, fontWeight: 700, color: '#10201A',
            marginBottom: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{product.name}</p>
          {product.description && (
            <p style={{
              fontSize: 12, color: '#8A9690', marginBottom: 8,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{product.description}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: product.description ? 0 : 6 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#2EA66F' }}>¥{Number(product.price).toFixed(2)}</span>
            <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#8A9690' }}>
              <span>库存 {product.stock}</span>
              {product.soldCount !== undefined && <span>已售 {product.soldCount}</span>}
            </div>
          </div>
        </div>

        {/* 右箭头 */}
        <div style={{ color: '#C8D4CC', flexShrink: 0, fontSize: 18 }}>
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
            <path d="M1 1l5 5-5 5" stroke="#C8D4CC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </Link>
  )
}
