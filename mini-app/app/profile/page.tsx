'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '../../components/AppHeader';
import BottomNav from '../../components/BottomNav';

interface UserInfo {
  id: number;
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  balance: number;
  createdAt: string;
}

interface OrderStats {
  all: number;
  pending: number;
  processing: number;
  completed: number;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<OrderStats>({ all: 0, pending: 0, processing: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/user').then(r => r.json()),
      fetch('/api/orders').then(r => r.json()),
    ]).then(([userData, ordersData]) => {
      setUser(userData?.user || userData);
      const orders = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];
      setStats({
        all: orders.length,
        pending: orders.filter((o: {status:string}) => o.status === 'PENDING').length,
        processing: orders.filter((o: {status:string}) => o.status === 'PROCESSING' || o.status === 'PAID').length,
        completed: orders.filter((o: {status:string}) => o.status === 'COMPLETED').length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.username || '用户';

  const orderEntries = [
    { label: '全部', count: stats.all, status: '' },
    { label: '待支付', count: stats.pending, status: 'PENDING' },
    { label: '处理中', count: stats.processing, status: 'PROCESSING' },
    { label: '已完成', count: stats.completed, status: 'COMPLETED' },
  ];

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100dvh' }}>
      <AppHeader title="个人中心" />

      <div className="pb-nav">
        {/* User Info Card */}
        <div style={{ padding: '20px 20px 0' }}>
          <div
            style={{
              borderRadius: 28,
              background: 'linear-gradient(145deg, #2EA66F 0%, #32B579 50%, #3DC97F 100%)',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 260,
            }}
          >
            {/* Deco */}
            <div style={{
              position: 'absolute', top: -30, right: -30,
              width: 150, height: 150, borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: -20,
              width: 100, height: 100, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
            }} />

            {loading ? (
              <div style={{ display: 'flex', gap: 16 }}>
                <div className="skeleton" style={{ width: 88, height: 88, borderRadius: 22, background: 'rgba(255,255,255,0.3)' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 20, width: '50%', marginBottom: 10, background: 'rgba(255,255,255,0.3)' }} />
                  <div className="skeleton" style={{ height: 14, width: '70%', background: 'rgba(255,255,255,0.3)' }} />
                </div>
              </div>
            ) : (
              <>
                {/* Avatar + Name Row */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 20, position: 'relative' }}>
                  {/* Avatar */}
                  <div
                    style={{
                      width: 88, height: 88,
                      borderRadius: 22,
                      background: 'rgba(255,255,255,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.9)" />
                      <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Name + ID */}
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{displayName}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.9)" />
                        <path d="M7 12L10.5 15.5L17 9" stroke="#32B579" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
                      ID: {user?.telegramId || '-'}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                      注册于 {user?.createdAt ? formatDate(user.createdAt) : '-'}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: 20 }} />

                {/* Balance Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40, height: 40,
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="5" width="20" height="14" rx="3" stroke="white" strokeWidth="1.8" />
                      <path d="M16 12C16 13.1046 16.8954 14 18 14H22V10H18C16.8954 10 16 10.8954 16 12Z" fill="white" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 2 }}>账户余额</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: 'white', lineHeight: 1 }}>
                      ¥{(user?.balance ?? 0).toFixed(2)}
                    </div>
                  </div>
                  <button
                    style={{
                      padding: '10px 22px',
                      borderRadius: 999,
                      background: 'white',
                      color: '#32B579',
                      fontWeight: 700,
                      fontSize: 14,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    充値
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* My Orders Card */}
        <div style={{ padding: '16px 20px 0' }}>
          <div
            style={{
              background: 'white',
              borderRadius: 24,
              boxShadow: '0 2px 12px rgba(16,32,26,0.07)',
              padding: '18px 18px 20px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#10201A' }}>我的订单</span>
              <button
                onClick={() => router.push('/orders')}
                style={{ fontSize: 13, color: '#32B579', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              >
                查看全部 &rsaquo;
              </button>
            </div>

            {/* 4 entries */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {orderEntries.map(entry => (
                <button
                  key={entry.label}
                  onClick={() => router.push(`/orders${entry.status ? '?status=' + entry.status : ''}`)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: 52, height: 52,
                        borderRadius: '50%',
                        background: '#E8F7EE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {entry.label === '全部' && (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="#32B579" strokeWidth="1.8" /></svg>
                      )}
                      {entry.label === '待支付' && (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#32B579" strokeWidth="1.8" /><path d="M12 7V12L15 14" stroke="#32B579" strokeWidth="1.8" strokeLinecap="round" /></svg>
                      )}
                      {entry.label === '处理中' && (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 4H20L18 14H6L4 4Z" stroke="#32B579" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="9" cy="19" r="1.5" fill="#32B579" /><circle cx="16" cy="19" r="1.5" fill="#32B579" /></svg>
                      )}
                      {entry.label === '已完成' && (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#32B579" strokeWidth="1.8" /><path d="M7.5 12L10.5 15L16.5 9" stroke="#32B579" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      )}
                    </div>
                    {entry.count > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -2, right: -2,
                          background: '#FF4B4B',
                          color: 'white',
                          fontSize: 10,
                          fontWeight: 700,
                          minWidth: 16, height: 16,
                          borderRadius: 999,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 4px',
                        }}
                      >
                        {entry.count}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: '#6B7C73', fontWeight: 500 }}>{entry.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Card */}
        <div style={{ padding: '12px 20px 0' }}>
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              boxShadow: '0 2px 12px rgba(16,32,26,0.07)',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 44, height: 44,
                borderRadius: '50%',
                background: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="#6B7C73" strokeWidth="1.8" />
              </svg>
            </div>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 15, color: '#10201A' }}>联系客服</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="#CCDBD5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>

      <BottomNav />
    </div>
  );
}
