'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppHeader from '../../../components/AppHeader';
import BottomNav from '../../../components/BottomNav';
import PaymentMethodTabs from '../../../components/PaymentMethodTabs';

type PaymentMethod = 'BALANCE' | 'USDT' | 'OKPAY';

interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  sales?: number;
  images?: string;
}

interface UserInfo {
  balance: number;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('BALANCE');
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${id}`).then(r => r.json()),
      fetch('/api/user').then(r => r.json()),
    ]).then(([productData, userData]) => {
      setProduct(productData?.product || productData);
      setUser(userData?.user || userData);
      setLoading(false);
    }).catch(() => {
      setError('加载失败');
      setLoading(false);
    });
  }, [id]);

  let imageUrl: string | null = null;
  try {
    const imgs = JSON.parse(product?.images || '[]');
    imageUrl = imgs[0] || null;
  } catch {}

  const totalPrice = product ? product.price * quantity : 0;
  const hasEnoughBalance = (user?.balance ?? 0) >= totalPrice;

  const handleBuy = () => {
    if (payMethod === 'BALANCE' && !hasEnoughBalance) {
      setToast('余额不足，请充値余额！');
      setTimeout(() => setToast(null), 2500);
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmPay = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product?.id, quantity, paymentMethod: payMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '下单失败');
      setShowConfirm(false);
      router.push(`/orders/${data.order?.id || data.id}`);
    } catch (e: unknown) {
      setShowConfirm(false);
      const msg = e instanceof Error ? e.message : '下单失败';
      setToast(msg);
      setTimeout(() => setToast(null), 2500);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#F6F6F8', minHeight: '100dvh' }}>
        <AppHeader title="商品详情" />
        <div style={{ padding: '20px 20px 0' }}>
          <div className="skeleton" style={{ height: 200, borderRadius: 24, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 24, width: '70%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 80, borderRadius: 20 }} />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ background: '#F6F6F8', minHeight: '100dvh' }}>
        <AppHeader title="商品详情" />
        <div style={{ textAlign: 'center', padding: 60, color: '#8A9690' }}>商品不存在</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100dvh', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
      <AppHeader title="商品详情" onClose={() => router.back()} />

      <div style={{ padding: '20px 20px 0' }}>
        {/* Product Image */}
        <div
          style={{
            background: 'white',
            borderRadius: 24,
            boxShadow: '0 2px 12px rgba(16,32,26,0.07)',
            overflow: 'hidden',
            marginBottom: 14,
            aspectRatio: '16/9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div
              style={{
                width: '100%', height: '100%',
                background: '#F0F4F2',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#32B579" strokeWidth="1.5" />
                <circle cx="9" cy="10" r="2" stroke="#32B579" strokeWidth="1.5" />
                <path d="M3 16L7 12L10 15L14 11L21 16" stroke="#32B579" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 13, color: '#8A9690' }}>暂无商品图片</span>
            </div>
          )}
        </div>

        {/* Name */}
        <div style={{ fontWeight: 800, fontSize: 20, color: '#10201A', marginBottom: 14, lineHeight: 1.3 }}>
          {product.name}
        </div>

        {/* Price & Stock */}
        <div
          style={{
            background: 'white',
            borderRadius: 20,
            boxShadow: '0 2px 12px rgba(16,32,26,0.07)',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#8A9690', marginBottom: 4 }}>售价</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#32B579' }}>¥{product.price.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#8A9690', marginBottom: 4 }}>库存</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#10201A' }}>{product.stock} 件</div>
          </div>
          {(product.sales ?? 0) > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#8A9690', marginBottom: 4 }}>已售</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#6B7C73' }}>{product.sales}</div>
            </div>
          )}
        </div>

        {/* Quantity */}
        <div
          style={{
            background: 'white',
            borderRadius: 20,
            boxShadow: '0 2px 12px rgba(16,32,26,0.07)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 15, color: '#10201A' }}>购买数量</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                border: '1.5px solid #ECEEF0',
                background: 'none', cursor: 'pointer',
                fontSize: 20, color: '#6B7C73',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >−</button>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#10201A', minWidth: 24, textAlign: 'center' }}>{quantity}</span>
            <button
              onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                border: 'none',
                background: '#32B579', cursor: 'pointer',
                fontSize: 20, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >+</button>
          </div>
        </div>

        {/* Service Guarantee */}
        <div
          style={{
            background: 'white',
            borderRadius: 20,
            boxShadow: '0 2px 12px rgba(16,32,26,0.07)',
            padding: '14px 18px',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 16 }}>
            {['🚀 自动发货', '✅ 正品保障', '🛡️ 售后无忧'].map(s => (
              <span key={s} style={{ fontSize: 12, color: '#6B7C73', fontWeight: 500 }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              boxShadow: '0 2px 12px rgba(16,32,26,0.07)',
              padding: '16px 18px',
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15, color: '#10201A', marginBottom: 10 }}>商品说明</div>
            <div style={{ fontSize: 14, color: '#6B7C73', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {product.description}
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div
          style={{
            background: 'white',
            borderRadius: 20,
            boxShadow: '0 2px 12px rgba(16,32,26,0.07)',
            padding: '16px 18px',
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, color: '#10201A', marginBottom: 14 }}>支付方式</div>
          <PaymentMethodTabs
            value={payMethod}
            onChange={setPayMethod}
            balance={user?.balance}
          />
        </div>

        {/* Balance insufficient warning */}
        {payMethod === 'BALANCE' && !hasEnoughBalance && (
          <div
            style={{
              background: '#FFF4E5',
              borderRadius: 14,
              padding: '12px 16px',
              marginBottom: 12,
              fontSize: 13,
              color: '#F59E0B',
              fontWeight: 500,
            }}
          >
            ⚠️ 余额不足，请充値余额！
          </div>
        )}
      </div>

      {/* Bottom Buy Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: 'white',
          borderTop: '1px solid #ECEEF0',
          padding: '12px 20px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          zIndex: 50,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#8A9690' }}>已选 {quantity} 件</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#32B579' }}>¥{totalPrice.toFixed(2)}</div>
        </div>
        <button
          onClick={handleBuy}
          style={{
            flex: 1,
            maxWidth: 200,
            padding: '14px 0',
            borderRadius: 999,
            background: product.stock === 0 ? '#CCDBD5' : '#32B579',
            color: 'white',
            fontWeight: 700,
            fontSize: 16,
            border: 'none',
            cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
          }}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? '已售罄' : '立即购买'}
        </button>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'flex-end',
            zIndex: 200,
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '28px 28px 0 0',
              padding: '28px 24px',
              paddingBottom: 'calc(28px + env(safe-area-inset-bottom))',
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 800, fontSize: 18, color: '#10201A', marginBottom: 12, textAlign: 'center' }}>确认支付</div>
            <div style={{ fontSize: 14, color: '#6B7C73', textAlign: 'center', marginBottom: 24, lineHeight: 1.7 }}>
              是否使用{payMethod === 'BALANCE' ? '余额' : payMethod}支付？
              {payMethod === 'BALANCE' && (
                <><br />当前余额 <span style={{ color: '#32B579', fontWeight: 700 }}>¥{(user?.balance ?? 0).toFixed(2)}</span><br />本次应付 <span style={{ color: '#32B579', fontWeight: 700 }}>¥{totalPrice.toFixed(2)}</span></>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: '14px', borderRadius: 999,
                  border: '1.5px solid #ECEEF0', background: 'none',
                  fontWeight: 600, fontSize: 15, color: '#6B7C73', cursor: 'pointer',
                }}
              >取消支付</button>
              <button
                onClick={handleConfirmPay}
                disabled={submitting}
                style={{
                  flex: 1, padding: '14px', borderRadius: 999,
                  border: 'none', background: submitting ? '#CCDBD5' : '#32B579',
                  fontWeight: 700, fontSize: 15, color: 'white', cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >{submitting ? '支付中...' : '确定支付'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(16,32,26,0.85)', color: 'white',
            padding: '10px 20px', borderRadius: 999,
            fontSize: 14, fontWeight: 500,
            zIndex: 300, whiteSpace: 'nowrap',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
