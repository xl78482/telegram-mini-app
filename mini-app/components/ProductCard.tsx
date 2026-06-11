'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

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

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
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
        borderRadius: 20,
        boxShadow: '0 2px 12px rgba(16,32,26,0.07)',
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: isSoldOut ? 'not-allowed' : 'pointer',
        opacity: isSoldOut ? 0.6 : 1,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
      onTouchStart={e => { if (!isSoldOut) e.currentTarget.style.transform = 'scale(0.985)'; }}
      onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {/* Image */}
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: 16,
          overflow: 'hidden',
          flexShrink: 0,
          background: '#F0F4F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="#32B579" strokeWidth="1.5" />
            <circle cx="9" cy="10" r="2" stroke="#32B579" strokeWidth="1.5" />
            <path d="M3 16L7 12L10 15L14 11L21 16" stroke="#32B579" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        )}
        {isSoldOut && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 16,
          }}>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>售罄</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700,
          fontSize: 15,
          color: '#10201A',
          marginBottom: 4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {product.name}
        </div>
        {product.description && (
          <div style={{
            fontSize: 13,
            color: '#8A9690',
            marginBottom: 8,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {product.description}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#32B579' }}>
            ¥{product.price.toFixed(2)}
          </span>
          <span style={{ fontSize: 12, color: '#8A9690' }}>库存 {product.stock}</span>
          {(product.sales ?? 0) > 0 && (
            <span style={{ fontSize: 12, color: '#8A9690' }}>已售 {product.sales}</span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: '#CCDBD5' }}>
        <path d="M9 6L15 12L9 18" stroke="#CCDBD5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
