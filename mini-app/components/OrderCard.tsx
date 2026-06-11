'use client';

import { useRouter } from 'next/navigation';
import StatusBadge from './StatusBadge';

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
  createdAt: string;
}

interface OrderCardProps {
  order: Order;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${y}年${mo}月${day}日 ${h}:${mi}`;
}

export default function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();
  const firstItem = order.items[0];
  const isUsdt = order.paymentMethod === 'USDT';
  const isOkpay = order.paymentMethod === 'OKPAY';
  const isFiat = !isUsdt && !isOkpay;

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 24,
        boxShadow: '0 2px 12px rgba(16,32,26,0.07)',
        overflow: 'hidden',
        marginBottom: 14,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px 12px',
          borderBottom: '1px solid #F3F4F6',
        }}
      >
        <span style={{ fontSize: 13, color: '#8A9690' }}>
          订单号：<span style={{ color: '#6B7C73', fontWeight: 500 }}>{order.orderNo}</span>
        </span>
        <StatusBadge status={order.status} />
      </div>

      {/* Product info */}
      <div style={{ padding: '14px 18px 12px', display: 'flex', gap: 12 }}>
        {/* Avatar */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: '#F0F4F2',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="#32B579" strokeWidth="1.5" />
            <circle cx="9" cy="10" r="2" stroke="#32B579" strokeWidth="1.5" />
            <path d="M3 16L7 12L10 15L14 11L21 16" stroke="#32B579" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#10201A', marginBottom: 5 }}>
            {firstItem?.productName || '商品'}
          </div>
          <div style={{ fontSize: 13, color: '#8A9690' }}>
            数量 {firstItem?.quantity ?? 1} · {isUsdt ? 'USDT' : isOkpay ? 'OKPay' : '余额'} · {formatDate(order.createdAt)}
          </div>
        </div>
      </div>

      {/* Amount */}
      <div style={{ padding: '0 18px 12px' }}>
        {isFiat ? (
          <span style={{ fontSize: 14, color: '#6B7C73' }}>
            实付 <span style={{ color: '#32B579', fontWeight: 700, fontSize: 16 }}>¥{order.totalAmount.toFixed(2)}</span>
          </span>
        ) : (
          <span style={{ fontSize: 14, color: '#6B7C73' }}>
            实付 <span style={{ color: '#4F74E8', fontWeight: 700, fontSize: 16 }}>{order.totalAmount.toFixed(2)} {isUsdt ? 'USDT' : 'OKPay'}</span>
            {' '}<span style={{ color: '#8A9690', fontSize: 12 }}>约 ¥{order.totalAmount.toFixed(2)}</span>
          </span>
        )}
      </div>

      {/* Divider dashed */}
      <div style={{ margin: '0 18px', borderTop: '1px dashed #ECEEF0' }} />

      {/* Actions */}
      <div
        style={{
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
        }}
      >
        <button
          style={{
            padding: '8px 18px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            border: '1.5px solid #32B579',
            background: 'transparent',
            color: '#32B579',
            cursor: 'pointer',
          }}
        >
          联系客服
        </button>
        <button
          onClick={() => router.push(`/orders/${order.id}`)}
          style={{
            padding: '8px 18px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            background: '#32B579',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          查看详情
        </button>
      </div>
    </div>
  );
}
