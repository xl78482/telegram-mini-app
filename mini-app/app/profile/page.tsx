'use client';

import { useState, useEffect } from 'react';
import BottomNav from '../../components/BottomNav';
import RechargeSheet from '../../components/RechargeSheet';

interface UserInfo {
  id: number;
  telegramId?: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  balance: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [rechargeOpen, setRechargeOpen] = useState(false);

  useEffect(() => {
    fetch('/api/user')
      .then(r => r.json())
      .then(data => { setUser(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || `用户${user.id}`
    : '-';

  return (
    <div className="tg-page" style={{ background: '#F6F6F8' }}>

      {/* 个人卡片 - 绿色渐变 */}
      <div style={{ padding: '16px 16px 0' }}>
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
              <div className="skeleton" style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
              <div>
                <div className="skeleton" style={{ height: 20, width: 100, marginBottom: 8, background: 'rgba(255,255,255,0.2)' }} />
                <div className="skeleton" style={{ height: 14, width: 70, background: 'rgba(255,255,255,0.15)' }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* 头像 */}
              <div
                style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 26, fontWeight: 800, color: 'white',
                }}
              >
                {displayName[0]?.toUpperCase() || '商'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 4 }}>
                  {displayName}
                </div>
                {user?.username && (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>@{user.username}</div>
                )}
              </div>
            </div>
          )}

          {/* 余额展示 */}
          <div
            style={{
              marginTop: 20,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 16, padding: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', marginBottom: 4 }}>账户余额</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'white' }}>
                ¥{loading ? '--' : (user?.balance ?? 0).toFixed(2)}
              </div>
            </div>
            <button
              onClick={() => setRechargeOpen(true)}
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                background: 'white',
                color: '#32B579',
                border: 'none',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              + 充値
            </button>
          </div>
        </div>
      </div>

      {/* 功能列表 */}
      <div style={{ margin: '16px 12px 0', background: 'white', borderRadius: 20, boxShadow: '0 1px 8px rgba(16,32,26,0.05)' }}>
        {[
          { icon: '📋', label: '我的订单', href: '/orders' },
          { icon: '💬', label: '联系客服', href: null },
          { icon: 'ℹ️', label: '关于店铺', href: null },
        ].map((item, i, arr) => (
          <div
            key={item.label}
            onClick={() => item.href && (window.location.href = item.href)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px',
              borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
              cursor: item.href ? 'pointer' : 'default',
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#10201A', flex: 1 }}>{item.label}</span>
            {item.href && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 6L15 12L9 18" stroke="#CCDBD5" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            )}
          </div>
        ))}
      </div>

      <BottomNav />

      {/* 充値 Sheet */}
      <RechargeSheet
        isOpen={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        currentBalance={user?.balance ?? 0}
      />
    </div>
  );
}
