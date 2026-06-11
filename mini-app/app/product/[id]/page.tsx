'use client';
/* BUILD: 2026-06-11-v5 */

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

interface UserInfo {
  id: number;
  balance: string | number;
}

interface OrderResult {
  id: number;
  orderNo: string;
  status: string;
  payStatus: string;
  paymentMethod: string;
  totalAmount: string;
  expiresAt: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpec, setSelectedSpec] = useState<Spec | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<OrderResult | null>(null);
  const [paying, setPaying] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    showBackButton(() => router.back());
    return () => hideBackButton();
  }, [router]);

  useEffect(() => {
    // 加载商品和用户信息
    Promise.all([
      apiFetch<Product>(`/api/products/${id}`),
      apiFetch<UserInfo>('/api/user'),
    ])
      .then(([productData, userData]) => {
        setProduct(productData);
        setUser(userData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const images: string[] = (() => {
    try { return product?.images ? JSON.parse(product.images) : []; }
    catch { return []; }
  })();

  const displayPrice = selectedSpec
    ? Number(selectedSpec.price)
    : Number(product?.price ?? 0);

  const totalAmount = displayPrice * quantity;

  const inStock = selectedSpec
    ? selectedSpec.stock >= quantity
    : (product?.stock ?? 0) >= quantity;

  const maxQuantity = selectedSpec
    ? Math.min(selectedSpec.stock, 10)
    : Math.min(product?.stock ?? 0, 10);

  const userBalance = Number(user?.balance ?? 0);

  // 创建订单
  async function handleBuy() {
    if (!product || !inStock) return;

    // 检查是否选择了规格
    if (product.specs && product.specs.length > 0 && !selectedSpec) {
      alert('请先选择规格');
      return;
    }

    setCreatingOrder(true);
    try {
      const orderData = await apiFetch<OrderResult>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: [{
            productId: product.id,
            specId: selectedSpec?.id ?? null,
            quantity,
          }],
          paymentMethod: 'BALANCE',
        }),
      });

      // 创建订单成功，显示支付确认弹窗
      setPendingOrder(orderData);
      setShowPayModal(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '下单失败，请稍后重试');
    } finally {
      setCreatingOrder(false);
    }
  }

  // 余额支付
  async function handlePay() {
    if (!pendingOrder) return;

    setPaying(true);
    try {
      const result = await apiFetch<{ ok: boolean; message?: string; error?: string; deliveredCount?: number }>(
        `/api/orders/${pendingOrder.id}/pay/balance`,
        { method: 'POST' }
      );

      if (result.ok) {
        setShowPayModal(false);
        // 支付成功，跳转订单详情
        router.push(`/orders/${pendingOrder.id}`);
      } else {
        alert(result.error || '支付失败');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '支付失败，请稍后重试';
      if (message.includes('余额不足')) {
        alert('余额不足，请充值余额');
      } else {
        alert(message);
      }
    } finally {
      setPaying(false);
    }
  }

  // 取消支付，跳转订单详情（订单仍为待支付状态）
  function handleCancelPay() {
    setShowPayModal(false);
    if (pendingOrder) {
      router.push(`/orders/${pendingOrder.id}`);
    }
  }

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
                onClick={() => {
                  setSelectedSpec(selectedSpec?.id === spec.id ? null : spec);
                  setQuantity(1); // 切换规格时重置数量
                }}
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

      {/* 数量选择 */}
      {inStock && (
        <div style={{ padding: '0 var(--page-padding-x) 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#10201A', marginBottom: 10 }}>购买数量</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              style={{
                width: 36, height: 36, borderRadius: 12,
                border: '1.5px solid #ECEEF0', background: 'white',
                fontSize: 18, fontWeight: 700, color: quantity <= 1 ? '#8A9690' : '#10201A',
                cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
              }}
            >−</button>
            <span style={{ fontSize: 16, fontWeight: 700, minWidth: 40, textAlign: 'center' }}>{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={quantity >= maxQuantity}
              style={{
                width: 36, height: 36, borderRadius: 12,
                border: '1.5px solid #ECEEF0', background: 'white',
                fontSize: 18, fontWeight: 700, color: quantity >= maxQuantity ? '#8A9690' : '#10201A',
                cursor: quantity >= maxQuantity ? 'not-allowed' : 'pointer',
              }}
            >+</button>
            <span style={{ fontSize: 12, color: '#8A9690' }}>最多 {maxQuantity} 件</span>
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
            ¥{totalAmount.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: '#8A9690' }}>
            {inStock ? `库存 ${selectedSpec?.stock ?? product.stock}` : '已售罄'}
            {user && <span style={{ marginLeft: 8 }}>余额 ¥{userBalance.toFixed(2)}</span>}
          </div>
        </div>
        <button
          onClick={handleBuy}
          disabled={!inStock || creatingOrder}
          style={{
            padding: '14px 32px', borderRadius: 999, border: 'none',
            background: !inStock ? '#ECEEF0' : creatingOrder ? '#A8D4B8' : '#32B579',
            color: !inStock ? '#8A9690' : 'white',
            fontWeight: 700, fontSize: 16, cursor: !inStock ? 'not-allowed' : 'pointer',
          }}
        >
          {creatingOrder ? '下单中...' : inStock ? '立即购买' : '已售罄'}
        </button>
      </div>

      {/* 支付确认弹窗 */}
      {showPayModal && pendingOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white', borderRadius: 24, padding: '24px 20px',
            maxWidth: 320, width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#10201A', marginBottom: 16, textAlign: 'center' }}>
              确认余额支付
            </div>
            <div style={{ background: '#F6F6F8', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#8A9690' }}>订单金额</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#10201A' }}>¥{Number(pendingOrder.totalAmount).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#8A9690' }}>当前余额</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#32B579' }}>¥{userBalance.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#8A9690' }}>支付后余额</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: userBalance >= totalAmount ? '#10201A' : '#E53935' }}>
                  ¥{(userBalance - Number(pendingOrder.totalAmount)).toFixed(2)}
                </span>
              </div>
            </div>
            {userBalance < Number(pendingOrder.totalAmount) && (
              <div style={{
                background: '#FFF4E5', borderRadius: 12, padding: '12px',
                marginBottom: 16, textAlign: 'center',
              }}>
                <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>⚠️ 余额不足，请充值余额</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleCancelPay}
                disabled={paying}
                style={{
                  flex: 1, padding: '12px', borderRadius: 999,
                  border: '1.5px solid #E0E0E0', background: 'transparent',
                  color: '#8A9690', fontWeight: 600, fontSize: 14,
                  cursor: paying ? 'not-allowed' : 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handlePay}
                disabled={paying || userBalance < Number(pendingOrder.totalAmount)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 999,
                  border: 'none',
                  background: userBalance < Number(pendingOrder.totalAmount) ? '#ECEEF0' : paying ? '#A8D4B8' : '#32B579',
                  color: userBalance < Number(pendingOrder.totalAmount) ? '#8A9690' : 'white',
                  fontWeight: 700, fontSize: 14,
                  cursor: userBalance < Number(pendingOrder.totalAmount) ? 'not-allowed' : 'pointer',
                }}
              >
                {paying ? '支付中...' : '确认支付'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}