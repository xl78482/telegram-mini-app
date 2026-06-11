'use client';
/* BUILD: 2026-06-11-v4 */

import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import ProductCard, { type Product } from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { hapticSelection } from '../lib/telegram/webapp';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('全部');

  useEffect(() => {
    fetch('/api/products')
      .then(async r => {
        const data = await r.json();
        if (!r.ok) {
          // 接口返回非 200
          throw new Error(data?.error ?? `接口异常 (${r.status})`);
        }
        if (!Array.isArray(data)) {
          // 返回格式异常
          throw new Error('接口返回格式异常');
        }
        return data as Product[];
      })
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(e => {
        console.error('[products fetch]', e);
        setError(e?.message ?? '商品加载失败，请稍后重试');
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
    <div className="tg-page page-enter" style={{ background: '#F6F6F8' }}>

      {/* ======================================================
          店铺信息卡片
          padding-top 使用 calc(var(--app-content-top) + 12px)
          避开 Telegram 控制按钒区域，内容卡片颟外留出 12px 外边距
          ====================================================== */}
      <div style={{ padding: 'calc(var(--app-content-top) + 12px) var(--page-padding-x) 0' }}>
        <div
          style={{
            borderRadius: 28,
            background: 'linear-gradient(135deg, #5DAE85 0%, #6FBE92 100%)',
            padding: '26px 20px 30px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 装饰圆 */}
          <div style={{
            position: 'absolute', top: -24, right: -24,
            width: 130, height: 130, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
          }} />

          {/* 店铺信息 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'rgba(255,255,255,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M3 9H21L19.5 4H4.5L3 9Z" fill="rgba(255,255,255,0.95)" />
                <path d="M3 9V20H21V9" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 9V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V9" stroke="white" strokeWidth="1.8" />
              </svg>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: 0.3 }}>数字商城</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 600, color: 'white',
                  background: 'rgba(255,255,255,0.22)', padding: '3px 10px', borderRadius: 999,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3L19 6V11C19 15.5 16 19 12 21C8 19 5 15.5 5 11V6L12 3Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                    <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  已认证
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
                精选数字商品 · 自动发货
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 分类 + 商品卡片 */}
      <div style={{
        margin: '-20px 12px 0',
        background: 'white',
        borderRadius: 24,
        boxShadow: '0 4px 20px rgba(16,32,26,0.09)',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 16px 10px',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#2EA66F" strokeWidth="1.8" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#2EA66F" strokeWidth="1.8" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#2EA66F" strokeWidth="1.8" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#2EA66F" strokeWidth="1.8" />
            </svg>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#10201A' }}>商品分类</span>
          </span>
          <span style={{ fontSize: 13, color: '#8A9690' }}>共 {products.length} 件好物</span>
        </div>

        {/* 分类标签 */}
        <div className="no-scrollbar" style={{ overflowX: 'auto', display: 'flex', gap: 8, padding: '0 16px 14px' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => { hapticSelection(); setActiveCategory(cat); }} className="pressable" style={{
              padding: '6px 16px', borderRadius: 999, fontSize: 13,
              fontWeight: activeCategory === cat ? 700 : 500,
              background: activeCategory === cat ? '#32B579' : '#F3F4F6',
              color: activeCategory === cat ? 'white' : '#6B7C73',
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'background 0.2s ease, color 0.2s ease',
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
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontSize: 14, color: '#E53935', fontWeight: 600, marginBottom: 6 }}>
                商品加载失败，请稍后重试
              </div>
              <div style={{ fontSize: 12, color: '#8A9690' }}>{error}</div>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2.5L20 6.5V17.5L12 21.5L4 17.5V6.5L12 2.5Z" stroke="#9AA5A0" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M4 6.5L12 10.5L20 6.5" stroke="#9AA5A0" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M12 10.5V21.5" stroke="#9AA5A0" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              }
              title="暂无商品"
              description="商家还没有上架商品，敬请期待"
            />
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
