'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBackButton } from '../../../hooks/use-back-button';

interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  images?: string;
  isActive: boolean;
  category?: string | null;
}

export default function ProductDetailPage() {
  useBackButton();
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(r => r.json())
      .then((data: Product) => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const openPayModal = () => {
    setShowPayModal(true);
    setTimeout(() => setPayModalVisible(true), 10);
  };
  const closePayModal = () => {
    setPayModalVisible(false);
    setTimeout(() => setShowPayModal(false), 300);
  };

  const handleBuy = async () => {
    if (paying || !product) return;
    setPaying(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: qty }),
      });
      const data = await res.json() as { orderId?: number; error?: string };
      if (res.ok) {
        closePayModal();
        if (data.orderId) {
          router.push(`/orders/${data.orderId}`);
        }
      } else {
        setPayResult('购买失败: ' + (data.error ?? '未知错误'));
      }
    } catch {
      setPayResult('网络错误，请重试');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="tg-page tg-content-top" style={{ padding: '24px 16px' }}>
      <div className="skeleton" style={{ height: 220, borderRadius: 24, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 16, width: '45%' }} />
    </div>
  );

  if (!product) return (
    <div className="tg-page tg-content-top" style={{ padding: '24px 16px', textAlign: 'center', color: '#8A9690' }}>
      商品不存在或已下架
    </div>
  );

  let images: string[] = [];
  try { images = JSON.parse(product.images ?? '[]') as string[]; } catch { images = []; }

  const totalPrice = (product.price * qty).toFixed(2);
  const stockTagColor = product.stock > 0 ? '#8A9690' : '#E53E3E';
  const stockTagBg = product.stock > 0 ? '#F3F4F6' : '#FFF0F0';

  return (
    <div className="tg-page tg-content-top" style={{ background: '#F6F6F8' }}>

      {/* 商品主图 */}
      {images.length > 0 ? (
        <img
          src={images[0]}
          alt={product.name}
          style={{
            width: '100%',
            aspectRatio: '16/9',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%', height: 200,
            background: 'linear-gradient(135deg, #E8F7EE 0%, #d0edd8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="#32B579" strokeWidth="1.5" />
            <circle cx="9" cy="10" r="2" stroke="#32B579" strokeWidth="1.5" />
            <path d="M3 16L7 12L10 15L14 11L21 16" stroke="#32B579" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* 商品信息卡 */}
      <div style={{ margin: '-16px 12px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '20px 18px', boxShadow: '0 2px 12px rgba(16,32,26,0.07)' }}>
          {product.category && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: '#32B579', background: '#E8F7EE',
              padding: '3px 10px', borderRadius: 999, marginBottom: 10, display: 'inline-block',
            }}>
              {product.category}
            </span>
          )}
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#10201A', margin: '8px 0', lineHeight: 1.3 }}>
            {product.name}
          </h1>
          {product.description && (
            <p style={{ fontSize: 14, color: '#6B7C73', lineHeight: 1.7, margin: '0 0 14px' }}>
              {product.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#32B579' }}>
              ¥{product.price.toFixed(2)}
            </span>
            <span style={{ fontSize: 12, background: stockTagBg, color: stockTagColor, padding: '4px 12px', borderRadius: 999 }}>
              {product.stock > 0 ? `库存 ${product.stock}` : '售罄'}
            </span>
          </div>
        </div>
      </div>

      {/* 数量选择 */}
      {product.stock > 0 && (
        <div style={{ margin: '12px 12px 0' }}>
          <div style={{ background: 'white', borderRadius: 18, padding: '16px 18px', boxShadow: '0 2px 8px rgba(16,32,26,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: '#10201A' }}>购买数量</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: qty <= 1 ? '#F3F4F6' : '#E8F7EE',
                    border: 'none',
                    color: qty <= 1 ? '#CCDBD5' : '#32B579',
                    fontSize: 20, fontWeight: 700, cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >−</button>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#10201A', minWidth: 24, textAlign: 'center' }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  disabled={qty >= product.stock}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: qty >= product.stock ? '#F3F4F6' : '#E8F7EE',
                    border: 'none',
                    color: qty >= product.stock ? '#CCDBD5' : '#32B579',
                    fontSize: 20, fontWeight: 700, cursor: qty >= product.stock ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >+</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 底部购买栏 */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'white',
          borderTop: '1px solid #ECEEF0',
          padding: '12px 16px',
          paddingBottom: 'max(16px, var(--tg-safe-area-inset-bottom, env(safe-area-inset-bottom, 16px)))',
          display: 'flex', alignItems: 'center', gap: 14,
          zIndex: 90,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#8A9690' }}>合计</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#32B579' }}>¥{totalPrice}</div>
        </div>
        <button
          onClick={openPayModal}
          disabled={product.stock === 0}
          style={{
            flex: 1, padding: '14px',
            borderRadius: 999,
            background: product.stock === 0 ? '#CCDBD5' : '#32B579',
            color: 'white', border: 'none',
            fontWeight: 700, fontSize: 16,
            cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {product.stock === 0 ? '售罄' : '立即购买'}
        </button>
      </div>

      {/* 支付确认 Sheet */}
      {showPayModal && (
        <>
          <div
            onClick={closePayModal}
            style={{
              position: 'fixed', inset: 0,
              background: payModalVisible ? 'rgba(0,0,0,0.4)' : 'transparent',
              backdropFilter: payModalVisible ? 'blur(2px)' : 'none',
              transition: 'all 0.3s ease', zIndex: 200,
            }}
          />
          <div
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: 'white', borderRadius: '28px 28px 0 0',
              zIndex: 201, padding: '0 20px',
              transform: payModalVisible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
              paddingBottom: 'max(24px, var(--tg-safe-area-inset-bottom, env(safe-area-inset-bottom, 24px)))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 999, background: '#ECEEF0' }} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#10201A', textAlign: 'center', marginBottom: 20 }}>
              确认购买
            </div>
            <div style={{ background: '#F6F6F8', borderRadius: 16, padding: '16px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: '#6B7C73' }}>{product.name}</span>
                <span style={{ fontWeight: 700 }}>×{qty}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7C73' }}>应付金额</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: '#32B579' }}>¥{totalPrice}</span>
              </div>
            </div>
            {payResult && (
              <div style={{
                background: payResult.startsWith('购买失败') ? '#FFF4F4' : '#E8F7EE',
                color: payResult.startsWith('购买失败') ? '#E53E3E' : '#32B579',
                borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13,
              }}>
                {payResult}
              </div>
            )}
            <button
              onClick={handleBuy}
              disabled={paying}
              style={{
                width: '100%', padding: '16px',
                borderRadius: 999, border: 'none',
                background: paying ? '#CCDBD5' : '#32B579',
                color: 'white', fontWeight: 700, fontSize: 16,
                cursor: paying ? 'not-allowed' : 'pointer',
              }}
            >
              {paying ? '处理中...' : `确认支付 ¥${totalPrice}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
