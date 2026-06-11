'use client';

import { useState, useEffect } from 'react';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';

interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  sales?: number;
  images?: string;
  isActive: boolean;
  category?: string | null;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('全部');

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : data.products || []);
        setLoading(false);
      })
      .catch(() => {
        setError('加载失败，请重试');
        setLoading(false);
      });
  }, []);

  // Build categories
  const categories = ['全部', ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))];
  const filtered = activeCategory === '全部' ? products : products.filter(p => p.category === activeCategory);

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100dvh' }}>
      <AppHeader />

      <div className="pb-nav">
        {/* Shop Info Card */}
        <div style={{ padding: '20px 20px 0' }}>
          <div
            style={{
              borderRadius: 28,
              background: 'linear-gradient(135deg, #2EA66F 0%, #32B579 55%, #3DC97F 100%)',
              padding: '24px 24px 28px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative circles */}
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 120, height: 120, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
            }} />
            <div style={{
              position: 'absolute', bottom: -30, right: 40,
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
              {/* Shop Icon */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9H21L19.5 4H4.5L3 9Z" fill="rgba(255,255,255,0.9)" />
                  <path d="M3 9V20H21V9" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M9 9V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V9" stroke="white" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Shop Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>数字商城</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#32B579',
                      background: 'white',
                      padding: '2px 8px',
                      borderRadius: 999,
                    }}
                  >
                    已认证
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  精选数字商品 · 自动发货
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category + Products Card */}
        <div
          style={{
            margin: '-16px 16px 0',
            background: 'white',
            borderRadius: 24,
            boxShadow: '0 2px 16px rgba(16,32,26,0.08)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Category Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 18px 12px',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 16, color: '#10201A' }}>商品分类</span>
            <span style={{ fontSize: 13, color: '#8A9690' }}>共 {products.length} 件好物</span>
          </div>

          {/* Category Pills */}
          {categories.length > 1 && (
            <div
              className="no-scrollbar"
              style={{
                display: 'flex',
                gap: 8,
                padding: '0 18px 14px',
                overflowX: 'auto',
              }}
            >
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: activeCategory === cat ? 700 : 500,
                    background: activeCategory === cat ? '#32B579' : '#F3F4F6',
                    color: activeCategory === cat ? 'white' : '#6B7C73',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: '#F3F4F6', margin: '0 18px' }} />

          {/* Products */}
          <div style={{ padding: '14px 14px 14px' }}>
            {loading ? (
              // Skeleton
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '4px 0' }}>
                    <div className="skeleton" style={{ width: 68, height: 68, borderRadius: 16, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 13, width: '80%', marginBottom: 10 }} />
                      <div className="skeleton" style={{ height: 13, width: '40%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <EmptyState
                title="加载失败"
                description={error}
                action={
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 999,
                      background: '#32B579',
                      color: 'white',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    重新加载
                  </button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="暂无商品"
                description="商家还没有上架商品，敬请期待"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>

      <BottomNav />
    </div>
  );
}
