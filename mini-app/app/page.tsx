'use client';

import { useState, useEffect } from 'react';
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
        setProducts(Array.isArray(data) ? data : (data.products || []));
        setLoading(false);
      })
      .catch(() => {
        setError('加载失败，请重试');
        setLoading(false);
      });
  }, []);

  const categories = ['全部', ...Array.from(new Set(
    products.map(p => p.category).filter(Boolean) as string[]
  ))];

  const filtered = activeCategory === '全部'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="tg-page" style={{ background: '#F6F6F8' }}>

      {/* ==================== 店铺信息卡片 ==================== */}
      <div style={{ padding: '16px 16px 0' }}>
        <div
          style={{
            borderRadius: 28,
            background: 'linear-gradient(135deg, #27A065 0%, #2EA66F 40%, #32B579 75%, #3DC980 100%)',
            padding: '22px 20px 36px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 装饰光环 */}
          <div style={{
            position: 'absolute', top: -24, right: -24,
            width: 130, height: 130, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />
          <div style={{
            position: 'absolute', bottom: -20, left: 20,
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            {/* 店铺图标 */}
            <div
              style={{
                width: 72, height: 72,
                borderRadius: 20,
                background: 'rgba(255,255,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M3 9H21L19.5 4H4.5L3 9Z" fill="rgba(255,255,255,0.95)" />
                <path d="M3 9V20H21V9" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 9V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V9" stroke="white" strokeWidth="1.8" />
              </svg>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: 0.3 }}>财神商盟</span>
                <span
                  style={{
                    fontSize: 11, fontWeight: 700,
                    color: '#2EA66F',
                    background: 'white',
                    padding: '2px 9px',
                    borderRadius: 999,
                  }}
                >已认证</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                财神商盟精选商品 · 自动发货
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 分类 + 商品卡片（叠在绿卡下方） ==================== */}
      <div
        style={{
          margin: '-20px 12px 0',
          background: 'white',
          borderRadius: '24px 24px 24px 24px',
          boxShadow: '0 4px 20px rgba(16,32,26,0.09)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* 分类标题行 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 16px 10px',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 15, color: '#10201A' }}>商品分类</span>
          <span style={{ fontSize: 13, color: '#8A9690' }}>共 {products.length} 件好物</span>
        </div>

        {/* 分类 Pill 滚动 */}
        {categories.length > 1 && (
          <div
            className="no-scrollbar"
            style={{
              display: 'flex', gap: 8,
              padding: '0 16px 14px',
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
                  lineHeight: '22px',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* 分割线 */}
        <div style={{ height: 1, background: '#F3F4F6', margin: '0 16px' }} />

        {/* 商品列表 */}
        <div style={{ padding: '12px 12px 16px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '8px 4px' }}>
                  <div className="skeleton" style={{ width: 72, height: 72, borderRadius: 16, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 15, width: '55%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 13, width: '80%', marginBottom: 10 }} />
                    <div className="skeleton" style={{ height: 13, width: '35%' }} />
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
                    padding: '10px 24px', borderRadius: 999,
                    background: '#32B579', color: 'white',
                    border: 'none', fontWeight: 600, cursor: 'pointer',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 12 }} />
      <BottomNav />
    </div>
  );
}
