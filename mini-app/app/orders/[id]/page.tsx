'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppHeader from '../../../components/AppHeader';
import StatusBadge from '../../../components/StatusBadge';
import CopyButton from '../../../components/CopyButton';

interface CardKey {
  id: number;
  content: string;
}

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  orderNo: string;
  status: string;
  totalAmount: number;
  paymentMethod?: string | null;
  items: OrderItem[];
  cardKeys?: CardKey[];
  createdAt: string;
  paidAt?: string | null;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${String(d.getMonth()+1).padStart(2,'0')}月${String(d.getDate()).padStart(2,'0')}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const fetchOrder = async () => {
    try {
      const data = await fetch(`/api/orders/${id}`).then(r => r.json());
      setOrder(data?.order || data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await fetch(`/api/orders/${id}/cancel`, { method: 'POST' });
      await fetchOrder();
      showToast('订单已取消');
    } catch { showToast('取消失败'); }
    setCancelling(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrder();
    showToast('已刷新');
    setRefreshing(false);
  };

  const allCardKeys = order?.cardKeys || [];
  const allKeysText = allCardKeys.map(k => k.content).join('\n');

  if (loading) {
    return (
      <div style={{ background: '#F6F6F8', minHeight: '100dvh' }}>
        <AppHeader title="订单详情" onClose={() => router.back()} />
        <div style={{ padding: '20px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 20, marginBottom: 14 }} />)}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ background: '#F6F6F8', minHeight: '100dvh' }}>
        <AppHeader title="订单详情" onClose={() => router.back()} />
        <div style={{ textAlign: 'center', padding: 60, color: '#8A9690' }}>订单不存在</div>
      </div>
    );
  }

  const isUsdt = order.paymentMethod === 'USDT';
  const isOkpay = order.paymentMethod === 'OKPAY';
  const firstItem = order.items[0];

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100dvh', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
      <AppHeader title="订单详情" onClose={() => router.back()} />

      <div style={{ padding: '20px 20px 0' }}>
        {/* Order Info Card */}
        <div
          style={{
            background: 'white',
            borderRadius: 24,
            boxShadow: '0 2px 12px rgba(16,32,26,0.07)',
            padding: '18px',
            marginBottom: 14,
          }}
        >
          {/* Status Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: '#8A9690', marginBottom: 4 }}>订单状态</div>
              <StatusBadge status={order.status} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#8A9690', marginBottom: 4 }}>订单号</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#6B7C73', fontWeight: 500 }}>{order.orderNo}</span>
                <CopyButton text={order.orderNo} label="复制" />
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: '#F3F4F6', marginBottom: 14 }} />

          {/* Product Row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div
              style={{
                width: 56, height: 56,
                borderRadius: 14,
                background: '#F0F4F2',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#32B579" strokeWidth="1.5" />
                <circle cx="9" cy="10" r="2" stroke="#32B579" strokeWidth="1.5" />
                <path d="M3 16L7 12L10 15L14 11L21 16" stroke="#32B579" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#10201A', marginBottom: 4 }}>
                {firstItem?.productName || '商品'}
              </div>
              <div style={{ fontSize: 13, color: '#8A9690' }}>数量 ×{firstItem?.quantity ?? 1}</div>
            </div>
          </div>

          {/* Amount */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#8A9690' }}>金额</span>
            {isUsdt || isOkpay ? (
              <span style={{ fontSize: 15, fontWeight: 700, color: '#4F74E8' }}>
                {order.totalAmount.toFixed(2)} {isUsdt ? 'USDT' : 'OKPay'}
              </span>
            ) : (
              <span style={{ fontSize: 15, fontWeight: 700, color: '#32B579' }}>
                ¥{order.totalAmount.toFixed(2)}
              </span>
            )}
          </div>

          {/* Payment Method */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#8A9690' }}>支付方式</span>
            <span style={{ fontSize: 14, color: '#6B7C73', fontWeight: 500 }}>
              {order.paymentMethod === 'BALANCE' ? '余额' : order.paymentMethod || '-'}
            </span>
          </div>

          {/* Time */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: '#8A9690' }}>下单时间</span>
            <span style={{ fontSize: 14, color: '#6B7C73' }}>{formatDate(order.createdAt)}</span>
          </div>
        </div>

        {/* Card Keys */}
        <div
          style={{
            background: 'white',
            borderRadius: 24,
            boxShadow: '0 2px 12px rgba(16,32,26,0.07)',
            padding: '18px',
            marginBottom: 14,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16, color: '#10201A', marginBottom: 14 }}>卡密信息</div>

          {order.status === 'PENDING' || order.status === 'PAID' ? (
            <div
              style={{
                background: '#F0F4F2',
                borderRadius: 14,
                padding: '16px',
                textAlign: 'center',
                color: '#8A9690',
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              支付完成后自动发货
            </div>
          ) : order.status === 'CANCELLED' || order.status === 'TIMEOUT' ? (
            <div
              style={{
                background: '#F5F5F5',
                borderRadius: 14,
                padding: '16px',
                textAlign: 'center',
                color: '#8A9690',
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>❌</div>
              订单已取消，无法查看卡密信息
            </div>
          ) : allCardKeys.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8A9690', fontSize: 14, padding: '16px 0' }}>暂无卡密信息</div>
          ) : (
            <div>
              {allCardKeys.map((key, idx) => (
                <div
                  key={key.id}
                  style={{
                    background: '#F6F6F8',
                    borderRadius: 14,
                    padding: '12px 14px',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 12, color: '#8A9690', flexShrink: 0 }}>#{idx + 1}</span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: '#10201A',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                    }}
                  >
                    {key.content}
                  </span>
                  <CopyButton text={key.content} />
                </div>
              ))}

              {allCardKeys.length > 1 && (
                <div style={{ marginTop: 8 }}>
                  <CopyButton
                    text={allKeysText}
                    label="复制全部卡密"
                    style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: 'white',
          borderTop: '1px solid #ECEEF0',
          padding: '12px 20px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          display: 'flex',
          gap: 12,
          zIndex: 50,
        }}
      >
        {(order.status === 'PENDING') ? (
          <>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              style={{
                flex: 1, padding: '14px', borderRadius: 999,
                border: '1.5px solid #ECEEF0',
                background: 'none', fontWeight: 600, fontSize: 15,
                color: '#6B7C73', cursor: 'pointer',
              }}
            >
              {cancelling ? '取消中...' : '取消订单'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                flex: 1, padding: '14px', borderRadius: 999,
                border: 'none', background: refreshing ? '#CCDBD5' : '#32B579',
                fontWeight: 700, fontSize: 15, color: 'white', cursor: 'pointer',
              }}
            >
              {refreshing ? '刷新中...' : '刷新支付状态'}
            </button>
          </>
        ) : order.status === 'COMPLETED' ? (
          <>
            {allCardKeys.length > 0 && (
              <CopyButton
                text={allKeysText}
                label="复制卡密"
                style={{
                  flex: 1, padding: '14px 0',
                  justifyContent: 'center',
                  fontSize: 15,
                }}
              />
            )}
            <button
              style={{
                flex: 1, padding: '14px', borderRadius: 999,
                border: 'none', background: '#32B579',
                fontWeight: 700, fontSize: 15, color: 'white', cursor: 'pointer',
              }}
            >
              联系客服
            </button>
          </>
        ) : (
          <button
            onClick={() => router.back()}
            style={{
              flex: 1, padding: '14px', borderRadius: 999,
              border: 'none', background: '#32B579',
              fontWeight: 700, fontSize: 15, color: 'white', cursor: 'pointer',
            }}
          >
            返回
          </button>
        )}
      </div>

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
