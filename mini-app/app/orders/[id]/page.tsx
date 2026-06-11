'use client';
/* BUILD: 2026-06-11-v5 */

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { showBackButton, hideBackButton } from '../../../lib/telegram/webapp';
import { apiFetch } from '../../../lib/api-fetch';

interface OrderItem { name: string; productName?: string; specName?: string | null; quantity: number; price: string | number }
interface CardKey { id: number; content: string }
interface OrderDetail {
  id: number; status: string; payStatus: string; createdAt: string; updatedAt: string; paidAt?: string | null;
  totalAmount: string | number; paymentMethod?: string | null;
  cancelReason?: string | null; expiresAt?: string | null;
  items: OrderItem[];
  cardKeys?: CardKey[];
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  PENDING:    { label: '待支付', bg: '#FFF4E5', color: '#F59E0B', icon: '⏳' },
  PAID:       { label: '已支付', bg: '#EEF3FF', color: '#4F74E8', icon: '✅' },
  PROCESSING: { label: '处理中', bg: '#EEF3FF', color: '#4F74E8', icon: '⚙️' },
  COMPLETED:  { label: '已完成', bg: '#E8F7EE', color: '#2EA66F', icon: '✅' },
  CANCELLED:  { label: '已取消', bg: '#F5F5F5', color: '#8A9690', icon: '❌' },
}

const PAYMENT_METHOD_MAP: Record<string, string> = {
  BALANCE: '余额支付',
  EPUSDT: 'USDT支付',
  OKPAY: 'OKPay',
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    showBackButton(() => router.back());
    return () => hideBackButton();
  }, [router]);

  useEffect(() => {
    apiFetch<OrderDetail>(`/api/orders/${id}`)
      .then(data => { setOrder(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleCancel() {
    setCancelling(true);
    try {
      await apiFetch(`/api/orders/${id}/cancel`, { method: 'POST' });
      const updated = await apiFetch<OrderDetail>(`/api/orders/${id}`);
      setOrder(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '取消失败');
    } finally { setCancelling(false); }
  }

  async function handlePay() {
    setPaying(true);
    try {
      const result = await apiFetch<{ ok: boolean; message?: string; error?: string }>(
        `/api/orders/${id}/pay/balance`,
        { method: 'POST' }
      );
      if (result.ok) {
        // 支付成功，刷新订单详情
        const updated = await apiFetch<OrderDetail>(`/api/orders/${id}`);
        setOrder(updated);
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
    } finally { setPaying(false); }
  }

  function handleCopy(cardId: number, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(cardId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const status = order ? (STATUS_MAP[order.status] ?? { label: order.status, bg: '#F5F5F5', color: '#8A9690', icon: '❓' }) : null;
  const amount = Number(order?.totalAmount ?? 0);
  const isPaid = order?.status === 'COMPLETED' || order?.status === 'PAID' || order?.payStatus === 'SUCCESS';
  const isPending = order?.status === 'PENDING';
  const isCancelled = order?.status === 'CANCELLED';
  const cardKeys = order?.cardKeys ?? [];

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', background: '#F6F6F8',
        paddingTop: 'var(--app-content-top)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #32B579', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{
        minHeight: '100dvh', background: '#F6F6F8',
        paddingTop: 'var(--app-content-top)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
      }}>
        <div style={{ fontSize: 40 }}>📋</div>
        <div style={{ fontSize: 16, color: '#8A9690' }}>订单不存在</div>
        <button onClick={() => router.back()}
          style={{ padding: '10px 24px', borderRadius: 999, background: '#32B579', color: 'white', border: 'none', fontWeight: 600 }}>
          返回
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#F6F6F8',
      paddingTop: 'var(--app-content-top)',
      paddingBottom: 'calc(80px + var(--app-safe-bottom))',
    }}>
      <div style={{ padding: '12px var(--page-padding-x)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>订单详情</h1>
      </div>

      {/* 状态卡片 */}
      <div style={{ padding: '0 var(--page-padding-x) 12px' }}>
        <div style={{
          background: 'white', borderRadius: 20, padding: '20px',
          boxShadow: '0 2px 12px rgba(16,32,26,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: '#8A9690' }}>订单状态</span>
            {status && (
              <span style={{ fontSize: 13, fontWeight: 700, background: status.bg, color: status.color, padding: '4px 12px', borderRadius: 999 }}>
                {status.icon} {status.label}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: '#8A9690' }}>订单号 #{order.id}</div>
          <div style={{ fontSize: 13, color: '#8A9690', marginTop: 4 }}>
            {new Date(order.createdAt).toLocaleString('zh-CN')}
          </div>
          {order.paymentMethod && (
            <div style={{ fontSize: 13, color: '#8A9690', marginTop: 4 }}>
              支付方式：{PAYMENT_METHOD_MAP[order.paymentMethod] || order.paymentMethod}
            </div>
          )}
          {order.paidAt && (
            <div style={{ fontSize: 13, color: '#8A9690', marginTop: 4 }}>
              支付时间：{new Date(order.paidAt).toLocaleString('zh-CN')}
            </div>
          )}
          {order.cancelReason && (
            <div style={{ fontSize: 13, color: '#E53935', marginTop: 4 }}>
              取消原因：{order.cancelReason === 'TIMEOUT' ? '订单超时' : order.cancelReason === 'USER_CANCELLED' ? '用户取消' : order.cancelReason}
            </div>
          )}
        </div>
      </div>

      {/* 商品明细 */}
      <div style={{ padding: '0 var(--page-padding-x) 12px' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '16px 20px', boxShadow: '0 2px 12px rgba(16,32,26,0.07)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#10201A', marginBottom: 12 }}>商品明细</div>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < order.items.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#10201A' }}>
                  {item.productName || item.name}
                  {item.specName && <span style={{ fontSize: 12, color: '#32B579' }}> · {item.specName}</span>}
                </div>
                <div style={{ fontSize: 12, color: '#8A9690', marginTop: 2 }}>x{item.quantity}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#10201A' }}>¥{Number(item.price).toFixed(2)}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTop: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>合计</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#32B579' }}>¥{amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 卡密信息区域 - 只有已支付/已完成的订单才展示 */}
      {isPaid && cardKeys.length > 0 && (
        <div style={{ padding: '0 var(--page-padding-x) 12px' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '16px 20px', boxShadow: '0 2px 12px rgba(16,32,26,0.07)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#10201A', marginBottom: 12 }}>
              🔑 卡密信息（{cardKeys.length} 条）
            </div>
            {cardKeys.map((card, i) => (
              <div key={card.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 0', borderBottom: i < cardKeys.length - 1 ? '1px solid #F3F4F6' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#8A9690', marginBottom: 4 }}>卡密 #{i + 1}</div>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: '#10201A',
                    wordBreak: 'break-all', lineHeight: 1.5,
                  }}>
                    {card.content}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(card.id, card.content)}
                  style={{
                    marginLeft: 12, padding: '8px 12px', borderRadius: 999,
                    border: '1.5px solid #E0E0E0', background: copiedId === card.id ? '#E8F7EE' : 'transparent',
                    color: copiedId === card.id ? '#32B579' : '#8A9690',
                    fontWeight: 600, fontSize: 12, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {copiedId === card.id ? '已复制' : '复制'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 未支付订单提示 */}
      {isPending && !isCancelled && (
        <div style={{ padding: '0 var(--page-padding-x) 12px' }}>
          <div style={{
            background: '#FFF4E5', borderRadius: 16, padding: '12px 16px',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>
              ⏳ 订单待支付，支付成功后即可查看卡密
            </span>
          </div>
        </div>
      )}

      {/* 已取消订单提示 */}
      {isCancelled && (
        <div style={{ padding: '0 var(--page-padding-x) 12px' }}>
          <div style={{
            background: '#F5F5F5', borderRadius: 16, padding: '12px 16px',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: 13, color: '#8A9690', fontWeight: 600 }}>
              ❌ 订单已取消，无法查看卡密
            </span>
          </div>
        </div>
      )}

      {/* 底部操作栏 */}
      {isPending && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: `12px var(--page-padding-x) max(20px, var(--app-safe-bottom))`,
          background: 'white', borderTop: '1px solid #ECEEF0',
          display: 'flex', gap: 12,
        }}>
          <button
            onClick={handleCancel} disabled={cancelling}
            style={{
              flex: 1, padding: '14px', borderRadius: 999, border: '1.5px solid #E0E0E0',
              background: 'transparent', color: cancelling ? '#8A9690' : '#E53935',
              fontWeight: 700, fontSize: 15, cursor: cancelling ? 'not-allowed' : 'pointer',
            }}
          >
            {cancelling ? '取消中...' : '取消订单'}
          </button>
          {order.paymentMethod === 'BALANCE' && (
            <button
              onClick={handlePay} disabled={paying}
              style={{
                flex: 1, padding: '14px', borderRadius: 999, border: 'none',
                background: paying ? '#A8D4B8' : '#32B579', color: 'white',
                fontWeight: 700, fontSize: 15, cursor: paying ? 'not-allowed' : 'pointer',
              }}
            >
              {paying ? '支付中...' : '余额支付'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}