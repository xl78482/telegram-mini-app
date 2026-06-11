'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../components/BottomNav';
import EmptyState from '../../components/EmptyState';

const STATUS_TABS = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING', label: '待支付' },
  { key: 'PAID', label: '已支付' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'CANCELLED', label: '已取消' },
];

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:    { label: '待支付', bg: '#FFF4E5', color: '#F59E0B' },
  PAID:       { label: '已支付', bg: '#EEF3FF', color: '#4F74E8' },
  PROCESSING: { label: '处理中', bg: '#EEF3FF', color: '#4F74E8' },
  COMPLETED:  { label: '已完成', bg: '#E8F7EE', color: '#2EA66F' },
  CANCELLED:  { label: '已取消', bg: '#F5F5F5', color: '#8A9690' },
};

interface OrderItem {
  productName: string;
  quantity: number;
  price: string | number;
}

interface Order {
  id: number;
  status: string;
  createdAt: string;
  totalAmount?: string | number;
  total?: string | number;
  items?: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then((data: Order[] | { orders: Order[] }) => {
        setOrders(Array.isArray(data) ? data : (data.orders ?? []));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    if (activeStatus !== 'ALL' && o.status !== activeStatus) return false;
    if (search) {
      const idMatch = o.id?.toString().includes(search);
      const nameMatch = o.items?.[0]?.productName?.includes(search);
      if (!idMatch && !nameMatch) return false;
    }
    return true;
  });

  return (
    <div className="tg-page" style={{ background: '#F6F6F8' }}>

      {/* 页面标题 */}
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#10201A' }}>我的订单</span>
      </div>

      {/* 搜索框 */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'white', borderRadius: 14,
          padding: '10px 14px', gap: 10,
          boxShadow: '0 1px 6px rgba(16,32,26,0.05)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#8A9690" strokeWidth="2" />
            <path d="M20 20L17 17" stroke="#8A9690" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索订单号 / 商品名"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, color: '#10201A', background: 'transparent',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#8A9690', fontSize: 16 }}
            >×</button>
          )}
        </div>
      </div>

      {/* 状态筛选 */}
      <div
        className="no-scrollbar"
        style={{ display: 'flex', gap: 8, padding: '0 16px 14px', overflowX: 'auto' }}
      >
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveStatus(tab.key)}
            style={{
              padding: '6px 16px', borderRadius: 999,
              fontSize: 13, fontWeight: activeStatus === tab.key ? 700 : 500,
              background: activeStatus === tab.key ? '#32B579' : '#F3F4F6',
              color: activeStatus === tab.key ? 'white' : '#6B7C73',
              border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 订单列表 */}
      <div style={{ padding: '0 12px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: 20, padding: '16px', boxShadow: '0 1px 8px rgba(16,32,26,0.06)' }}>
                <div className="skeleton" style={{ height: 14, width: '45%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '40%' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="暂无订单" description="还没有订单，去选购一件吧" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(order => {
              const status = STATUS_MAP[order.status] ?? { label: order.status, bg: '#F5F5F5', color: '#8A9690' };
              const firstItem = order.items?.[0];
              const amount = Number(order.totalAmount ?? order.total ?? 0);
              return (
                <div
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  style={{
                    background: 'white', borderRadius: 20,
                    padding: '16px', cursor: 'pointer',
                    boxShadow: '0 1px 8px rgba(16,32,26,0.06)',
                    transition: 'transform 0.15s ease',
                  }}
                  onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.985)'; }}
                  onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: '#8A9690' }}>订单 #{order.id}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      background: status.bg, color: status.color,
                      padding: '3px 10px', borderRadius: 999,
                    }}>{status.label}</span>
                  </div>
                  {firstItem && (
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#10201A', marginBottom: 6 }}>
                      {firstItem.productName}
                      {(order.items?.length ?? 0) > 1 && (
                        <span style={{ fontSize: 12, color: '#8A9690' }}> 等 {order.items?.length} 件</span>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#8A9690' }}>
                      {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#32B579' }}>
                      ¥{amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
