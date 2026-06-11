'use client';
/* BUILD: 2026-06-11-v6 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../components/BottomNav';
import RechargeSheet from '../../components/RechargeSheet';
import { apiFetch } from '../../lib/api-fetch';
import { hapticImpact, hapticSelection } from '../../lib/telegram/webapp';

interface UserInfo {
  id: number;
  tgId?: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  balance: string | number;
  createdAt?: string;
}

interface OrderLite { id: number; status: string }

const ORDER_SHORTCUTS = [
  {
    key: 'ALL',
    label: '全部',
    statuses: null as string[] | null,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M3 6L4.5 7.5L7 5" stroke="#2EA66F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 12L4.5 13.5L7 11" stroke="#2EA66F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 18L4.5 19.5L7 17" stroke="#2EA66F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 6H21M11 12H21M11 18H21" stroke="#2EA66F" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'PENDING',
    label: '待支付',
    statuses: ['PENDING'],
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#2EA66F" strokeWidth="2" />
        <path d="M12 7V12L15 14" stroke="#2EA66F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'PROCESSING',
    label: '处理中',
    statuses: ['PAID', 'PROCESSING'],
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 3V6M12 18V21M5.6 5.6L7.7 7.7M16.3 16.3L18.4 18.4M3 12H6M18 12H21M5.6 18.4L7.7 16.3M16.3 7.7L18.4 5.6" stroke="#2EA66F" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'COMPLETED',
    label: '已完成',
    statuses: ['COMPLETED'],
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#2EA66F" strokeWidth="2" />
        <path d="M8 12L11 15L16 9" stroke="#2EA66F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function formatDate(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [rechargeOpen, setRechargeOpen] = useState(false);

  useEffect(() => {
    apiFetch<UserInfo>('/api/user')
      .then(data => { setUser(data); })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false));
    apiFetch<OrderLite[]>('/api/orders')
      .then(data => { setOrders(Array.isArray(data) ? data : []); })
      .catch(() => { /* ignore */ });
  }, []);

  const displayName = user
    ? ([user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || `用户${user.id}`)
    : null;
  const balance = Number(user?.balance ?? 0);

  const countFor = (statuses: string[] | null) => {
    if (!statuses) return orders.length;
    return orders.filter(o => statuses.includes(o.status)).length;
  };

  return (
    <div className="tg-page page-enter" style={{ background: '#F6F6F8' }}>

      {/* 顶部绿色资料卡 */}
      <div style={{ padding: 'calc(var(--app-content-top) + 12px) var(--page-padding-x) 0' }}>
        <div
          style={{
            borderRadius: 28,
            background: 'linear-gradient(135deg, #34B97C 0%, #6FCB9A 100%)',
            padding: '22px 22px 22px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 装饰光带 */}
          <div style={{
            position: 'absolute', top: 40, right: -60,
            width: 260, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            transform: 'rotate(-18deg)', pointerEvents: 'none',
          }} />

          {/* 头像 + 信息 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 700, color: 'white',
              flexShrink: 0, overflow: 'hidden',
            }}>
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={displayName ?? 'avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                displayName ? displayName.charAt(0).toUpperCase() : '👤'
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                <>
                  <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 8, background: 'rgba(255,255,255,0.3)' }} />
                  <div className="skeleton" style={{ height: 12, width: '40%', background: 'rgba(255,255,255,0.3)' }} />
                </>
              ) : (
                <>
                  <div style={{
                    fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 4,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {displayName ?? '加载中...'}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', marginBottom: 2 }}>
                    ID: {user?.id ?? '--'}
                  </div>
                  {user?.createdAt && (
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>
                      注册于 {formatDate(user.createdAt)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 分隔线 */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.25)', margin: '18px 0 16px' }} />

          {/* 余额 + 充值 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="18" height="13" rx="3" stroke="white" strokeWidth="1.8" />
                  <path d="M3 10H21" stroke="white" strokeWidth="1.8" />
                  <circle cx="17" cy="14.5" r="1.4" fill="white" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 2 }}>账户余额</div>
                {loading ? (
                  <div className="skeleton" style={{ height: 26, width: 80, background: 'rgba(255,255,255,0.3)' }} />
                ) : (
                  <div style={{ fontSize: 26, fontWeight: 900, color: 'white' }}>
                    ¥{balance.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => { hapticImpact('medium'); setRechargeOpen(true); }}
              className="pressable"
              style={{
                padding: '12px 28px', borderRadius: 999, border: 'none',
                background: 'white', color: '#2EA66F',
                fontWeight: 800, fontSize: 15, cursor: 'pointer', flexShrink: 0,
              }}
            >
              充值
            </button>
          </div>
        </div>
      </div>

      {/* 我的订单 */}
      <div style={{ padding: '14px var(--page-padding-x) 0' }}>
        <div style={{
          background: 'white', borderRadius: 20,
          padding: '20px', boxShadow: '0 2px 12px rgba(16,32,26,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#10201A' }}>我的订单</span>
            <button
              onClick={() => { hapticSelection(); router.push('/orders'); }}
              className="pressable"
              style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', color: '#8A9690', fontSize: 14 }}
            >
              查看全部
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M9 6L15 12L9 18" stroke="#8A9690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {ORDER_SHORTCUTS.map(item => {
              const count = countFor(item.statuses);
              return (
                <button
                  key={item.key}
                  onClick={() => { hapticSelection(); router.push('/orders'); }}
                  className="pressable"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    background: 'none', border: 'none', cursor: 'pointer', flex: 1,
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: '#EAF7F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.icon}
                    </div>
                    {count > 0 && (
                      <span style={{
                        position: 'absolute', top: -4, right: -4,
                        minWidth: 20, height: 20, padding: '0 6px',
                        borderRadius: 999, background: '#2EA66F', color: 'white',
                        fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid white',
                      }}>{count}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 13, color: '#4B5A52', fontWeight: 500 }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 优惠券 / 联系客服 */}
      <div style={{ padding: '14px var(--page-padding-x) 0' }}>
        <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(16,32,26,0.06)' }}>
          {/* 优惠券 */}
          <div className="pressable" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer',
          }}
          onClick={() => hapticSelection()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: '#F3F1FA',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="8" width="18" height="13" rx="2" stroke="#2EA66F" strokeWidth="1.8" />
                  <path d="M3 12H21" stroke="#2EA66F" strokeWidth="1.8" />
                  <path d="M12 8V21" stroke="#2EA66F" strokeWidth="1.8" />
                  <path d="M8 8C8 6 9.5 4.5 11 6C12 7 12 8 12 8M16 8C16 6 14.5 4.5 13 6C12 7 12 8 12 8" stroke="#2EA66F" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <span style={{ fontWeight: 600, fontSize: 15, color: '#10201A' }}>优惠券</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, color: '#8A9690' }}>暂无</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M9 6L15 12L9 18" stroke="#8A9690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* 联系客服 */}
          <a href="#" className="pressable" onClick={() => hapticSelection()} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px', textDecoration: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: '#EAF7F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12V17C20 18.1 19.1 19 18 19" stroke="#2EA66F" strokeWidth="1.8" strokeLinecap="round" />
                  <rect x="3" y="12" width="3.5" height="6" rx="1.5" stroke="#2EA66F" strokeWidth="1.8" />
                  <rect x="17.5" y="12" width="3.5" height="6" rx="1.5" stroke="#2EA66F" strokeWidth="1.8" />
                  <path d="M12 19H14" stroke="#2EA66F" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <span style={{ fontWeight: 600, fontSize: 15, color: '#10201A' }}>联系客服</span>
            </div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="#8A9690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      <RechargeSheet
        isOpen={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        currentBalance={balance}
      />
      <BottomNav />
    </div>
  );
}
