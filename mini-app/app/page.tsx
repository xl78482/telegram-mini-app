'use client';
/* BUILD: 2026-06-11-v3 */

import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import ProductCard, { type Product } from '../components/ProductCard';
import EmptyState from '../components/EmptyState';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('全部');

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then((data: Product[] | { products: Product[] }) => {
        setProducts(Array.isArray(data) ? data : (data.products ?? []));
        setLoading(false);
      })
      .catch(() => { setError('加载失败，请重试'); setLoading(false); });
  }, []);

  const categories = ['全部', ...Array.from(new Set(
    products.map(p => p.category).filter(Boolean) as string[]
  ))];

  const filtered = activeCategory === '全部'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="tg-page" style={{ background: '#F6F6F8' }}>

      {/* ======================================================
          店铺信息卡片
          顶部内边距使用 var(--app-content-top)，避开 Telegram 控制按钒区域。
          颟外加 16px 使绿色卡片与屏幕边缘有间距。
          ====================================================== */}
      <div style={{ padding: 'var(--app-content-top) var(--page-padding-x) 0' }}>
        <div
          style={{
            borderRadius: 28,
            background: 'linear-gradient(135deg, #27A065 0%, #2EA66F 40%, #32B579 75%, #3DC980 100%)',
            /* 内部内容顶部留 20px 内边距——这里不再需要颟外 offset，因为容器本身已经避开 */
            padding: '20px 20px 36px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 装饰圆 */}
          <div style={{
            position: 'absolute', top: -24, right: -24,
            width: 130, height: 130, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -20, left: 20,
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }} />

          {/* 店铺信息 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'rgba(255,255,255,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M3 9H21L19.5 4H4.5L3 9Z" fill="rgba(255,255,255,0.95)" />
                <path d="M3 9V20H21V9" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 9V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V9" stroke="white" strokeWidth="1.8" />
              </svg>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: 0.3 }}>财神商盟</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#2EA66F',
                  background: 'white', padding: '2px 9px', borderRadius: 999,
                }}>已认证</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                财神商盟精选商品 · 自动发货
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 分类 + 商品卡片 */}
      <div style={{
        margin: '-20px 12px 0',
        background: 'white',
        borderRadius: '24px 24px 24px 24px',
        boxShadow: '0 4px 20px rgba(16,32,26,0.09)',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 16px 10px',
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#10201A' }}>商品分类</span>
          <span style={{ fontSize: 13, color: '#8A9690' }}>共 {products.length} 件好物</span>
        </div>

        {/* 分类标签 */}
        <div className="no-scrollbar" style={{ overflowX: 'auto', display: 'flex', gap: 8, padding: '0 16px 14px' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: '6px 16px', borderRadius: 999, fontSize: 13,
              fontWeight: activeCategory === cat ? 700 : 500,
              background: activeCategory === cat ? '#32B579' : '#F3F4F6',
              color: activeCategory === cat ? 'white' : '#6B7C73',
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}>{cat}</button>
          ))}
        </div>

        {/* 商品列表 */}
        <div style={{ padding: '0 12px 16px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton" style={{ height: 200, borderRadius: 20 }} />
              ))}
            </div>
          ) : error ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#E53935', fontSize: 14 }}>{error}</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="暂无商品" description="该分类暂无商品" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
