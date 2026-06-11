'use client';
/* BUILD: 2026-06-11-v3 */

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { showBackButton, hideBackButton } from '../../../lib/telegram/webapp';
import { apiFetch } from '../../../lib/api-fetch';

interface Spec { id: number; name: string; price: string | number; stock: number }
interface Product {
  id: number; name: string; description?: string | null;
  price: string | number; stock: number; images?: string | null;
  category?: string | null; specs?: Spec[];
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpec, setSelectedSpec] = useState<Spec | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    showBackButton(() => router.back());
    return () => hideBackButton();
  }, [router]);

  useEffect(() => {
    apiFetch<Product>(`/api/products/${id}`)
      .then(data => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const images: string[] = (() => {
    try { return product?.images ? JSON.parse(product.images) : []; }
    catch { return []; }
  })();

  const displayPrice = selectedSpec
    ? Number(selectedSpec.price)
    : Number(product?.price ?? 0);

  const inStock = selectedSpec
    ? selectedSpec.stock > 0
    : (product?.stock ?? 0) > 0;

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', background: '#F6F6F8',
        paddingTop: 'var(--app-content-top)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #32B579', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{
        minHeight: '100dvh', background: '#F6F6F8',
        paddingTop: 'var(--app-content-top)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12,
      }}>
        <div style={{ fontSize: 40 }}>📦</div>
        <div style={{ fontSize: 16, color: '#8A9690' }}>商品不存在</div>
        <button onClick={() => router.back()}
          style={{ padding: '10px 24px', borderRadius: 999, background: '#32B579', color: 'white', border: 'none', fontWeight: 600 }}>
          返回
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F6F6F8', paddingBottom: 'calc(80px + var(--app-safe-bottom))' }}>
      {/* 商品图片——顶部避开安全区 */}
      <div style={{
        paddingTop: 'var(--app-content-top)',
        background: '#fff',
        borderRadius: '0 0 28px 28px',
        overflow: 'hidden',
      }}>
        {images.length > 0 && !imgError ? (
          <img
            src={images[0]}
            alt={product.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            height: 240, background: '#F3F4F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 64,
          }}>
            🛎️
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div style={{ padding: '16px var(--page-padding-x)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#10201A', margin: '0 0 8px' }}>{product.name}</h1>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#32B579' }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>¥</span>{displayPrice.toFixed(2)}
        </div>
        {product.description && (
          <p style={{ marginTop: 12, fontSize: 14, color: '#6B7C73', lineHeight: 1.7 }}>{product.description}</p>
        )}
      </div>

      {/* 规格选择 */}
      {product.specs && product.specs.length > 0 && (
        <div style={{ padding: '0 var(--page-padding-x) 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#10201A', marginBottom: 10 }}>选择规格</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {product.specs.map(spec => (
              <button key={spec.id}
                onClick={() => setSelectedSpec(selectedSpec?.id === spec.id ? null : spec)}
                disabled={spec.stock <= 0}
                style={{
                  padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                  border: selectedSpec?.id === spec.id ? '2px solid #32B579' : '1.5px solid #ECEEF0',
                  background: selectedSpec?.id === spec.id ? '#E8F7EE' : 'white',
                  color: spec.stock <= 0 ? '#8A9690' : selectedSpec?.id === spec.id ? '#2EA66F' : '#10201A',
                  cursor: spec.stock <= 0 ? 'not-allowed' : 'pointer',
                  opacity: spec.stock <= 0 ? 0.6 : 1,
                }}
              >
                {spec.name}
                <span style={{ fontSize: 11, marginLeft: 4, opacity: 0.8 }}>¥{Number(spec.price).toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 底部购买栏 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: `12px var(--page-padding-x) max(20px, var(--app-safe-bottom))`,
        background: 'white', borderTop: '1px solid #ECEEF0',
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#32B579' }}>
            ¥{displayPrice.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: '#8A9690' }}>
            {inStock ? `库存 ${selectedSpec?.stock ?? product.stock}` : '已售罄'}
          </div>
        </div>
        <button
          disabled={!inStock}
          style={{
            padding: '14px 32px', borderRadius: 999, border: 'none',
            background: inStock ? '#32B579' : '#ECEEF0',
            color: inStock ? 'white' : '#8A9690',
            fontWeight: 700, fontSize: 16, cursor: inStock ? 'pointer' : 'not-allowed',
          }}
        >
          {inStock ? '立即购买' : '已售罄'}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
