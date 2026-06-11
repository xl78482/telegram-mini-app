'use client';

import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  sales?: number;
  images?: string;
  isActive: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();

  let imageUrl: string | null = null;
  try {
    const imgs = JSON.parse(product.images || '[]');
    imageUrl = imgs[0] || null;
  } catch {}

  const isSoldOut = product.stock === 0;

  return (
    <div
      onClick={() => !isSoldOut && router.push(`/product/${product.id}`)}
      style={{
        background: 'white',
        borderRadius: 18,
        border: '1px solid #F0F0F0',
        padding: '14px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        cursor: isSoldOut ? 'default' : 'pointer',
        opacity: isSoldOut ? 0.55 : 1,
        transition: 'transform 0.15s ease',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: 'none',
      }}
      onTouchStart={e => { if (!isSoldOut) e.currentTarget.style.transform = 'scale(0.982)'; }}
      onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseDown={e => { if (!isSoldOut) e.currentTarget.style.transform = 'scale(0.982)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {/* 商品图片 */}
      <div
        style={{
          width: 72, height: 72,
          borderRadius: 16,
          overflow: 'hidden',
          flexShrink: 0,
          background: '#F0F4F2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="#32B579" strokeWidth="1.5" />
            <circle cx="9" cy="10" r="2" stroke="#32B579" strokeWidth="1.5" />
            <path d="M3 16L7 12L10 15L14 11L21 16" stroke="#32B579" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        )}
        {isSoldOut && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.42)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 16,
          }}>
            <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>售罄</span>
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700, fontSize: 15, color: '#10201A',
          marginBottom: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {product.name}
        </div>

        {product.description && (
          <div style={{
            fontSize: 12, color: '#8A9690',
            marginBottom: 8,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {product.description}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#32B579' }}>
            售价：¥{product.price.toFixed(2)}
          </span>
          <span
            style={{
              fontSize: 12, color: '#8A9690',
              background: '#F3F4F6',
              padding: '2px 8px', borderRadius: 999,
            }}
          >
            库存 {product.stock}
          </span>
          {(product.sales ?? 0) > 0 && (
            <span style={{ fontSize: 12, color: '#8A9690' }}>已售 {product.sales}</span>
          )}
        </div>
      </div>

      {/* 右箭头 */}
      {!isSoldOut && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M9 6L15 12L9 18" stroke="#CCDBD5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}
