'use client';

import { useState, useEffect } from 'react';
import BottomNav from '../../components/BottomNav';
import RechargeSheet from '../../components/RechargeSheet';
import { apiFetch } from '../../lib/api-fetch';

interface UserInfo {
  id: number;
  telegramId?: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  balance: string | number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [rechargeOpen, setRechargeOpen] = useState(false);

  useEffect(() => {
    apiFetch<UserInfo>('/api/user')
      .then(data => { setUser(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || `用户${user.id}`
    : '-';
  const balance = Number(user?.balance ?? 0);

  return (
    <div className="tg-page" style={{ background: '#F6F6F8' }}>

      {/* 顶部绿色头图区域 */}
      <div style={{ padding: 'calc(var(--app-content-top) + 16px) 16px 0' }}>
        <div
          style={{
            borderRadius: 28,
            background: 'linear-gradient(135deg, #27A065 0%, #32B579 100%)',
            padding: '24px 20px',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 110, height: 110, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 16, width: '50%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '30%' }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, flexShrink: 0,
              }}>
                {displayName !== '-' ? displayName.charAt(0).toUpperCase() : '👤'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </div>
                {user?.username && (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>@{user.username}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 余额卡片 */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          background: 'white', borderRadius: 20,
          padding: '20px 20px',
          boxShadow: '0 2px 12px rgba(16,32,26,0.07)',
        }}>
          <div style={{ fontSize: 13, color: '#8A9690', marginBottom: 6 }}>账户余额</div>
          {loading ? (
            <div className="skeleton" style={{ height: 32, width: '40%' }} />
          ) : (
            <div style={{ fontSize: 32, fontWeight: 900, color: '#10201A' }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#8A9690' }}>¥</span>
              {balance.toFixed(2)}
            </div>
          )}
          <button
            onClick={() => setRechargeOpen(true)}
            style={{
              marginTop: 16, width: '100%', padding: '12px',
              borderRadius: 999, border: 'none',
              background: '#32B579', color: 'white',
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}
          >
            立即充値
          </button>
        </div>
      </div>

      {/* 功能卡片列表 */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(16,32,26,0.07)' }}>
          {[
            { icon: '📋', label: '我的订单', href: '/orders' },
            { icon: '💬', label: '联系客服', href: '#' },
            { icon: 'ℹ️', label: '关于店铺', href: '#' },
          ].map((item, idx, arr) => (
            <a
              key={item.label}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: idx < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
                textDecoration: 'none', color: '#10201A',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="#8A9690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ))}
        </div>
      </div>

      <RechargeSheet isOpen={rechargeOpen} onClose={() => setRechargeOpen(false)} />
      <BottomNav />
    </div>
  );
}
