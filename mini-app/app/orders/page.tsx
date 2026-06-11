'use client';

import { useState, useEffect } from 'react';
import AppHeader from '../../components/AppHeader';
import BottomNav from '../../components/BottomNav';
import OrderCard from '../../components/OrderCard';
import EmptyState from '../../components/EmptyState';

const STATUS_FILTERS = [
  { key: '', label: '全部' },
  { key: 'PENDING', label: '待付款' },
  { key: 'PROCESSING', label: '处理中' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'CANCELLED', label: '已取消' },
];

interface Order {
  id: number;
  orderNo: string;
  status: string;
  totalAmount: number;
  paymentMethod?: string | null;
  items: { id: number; productName: string; quantity: number; price: number }[];
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : data.orders || []);
        setLoading(false);
      })
      .catch(() => {
        setError('加载失败');
        setLoading(false);
      });
  }, []);

  const filtered = orders.filter(o => {
    const matchStatus = !activeStatus || o.status === activeStatus;
    const matchSearch = !search ||
      o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some(i => i.productName.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100dvh' }}>
      <AppHeader title="订单中心" />

      <div className="pb-nav">
        {/* Filter Card */}
        <div style={{ padding: '16px 20px 0' }}>
          <div
            style={{
              background: 'white',
              borderRadius: 24,
              boxShadow: '0 2px 12px rgba(16,32,26,0.07)',
              padding: '20px 18px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 17, color: '#10201A', marginBottom: 14 }}>我的订单</div>

            {/* Status filters */}
            <div
              className="no-scrollbar"
              style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}
            >
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveStatus(f.key)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: activeStatus === f.key ? 700 : 500,
                    background: activeStatus === f.key ? '#E8F7EE' : '#F3F4F6',
                    color: activeStatus === f.key ? '#32B579' : '#6B7C73',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 14,
                background: '#F6F6F8',
                borderRadius: 999,
                padding: '10px 16px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#8A9690" strokeWidth="2" />
                <path d="M16.5 16.5L21 21" stroke="#8A9690" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索订单号 / 商品名称"
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontSize: 14,
                  color: '#10201A',
                }}
              />
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div style={{ padding: '14px 20px 0' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: 'white', borderRadius: 24, padding: '18px', boxShadow: '0 2px 12px rgba(16,32,26,0.07)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div className="skeleton" style={{ height: 14, width: '50%' }} />
                    <div className="skeleton" style={{ height: 22, width: 60, borderRadius: 999 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 14 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: 15, width: '70%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 13, width: '90%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <EmptyState title="加载失败" description={error} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="暂无订单"
              description={search ? '未找到匹配的订单' : '还没有相关订单，快去选购吧'}
            />
          ) : (
            <div>
              {filtered.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
