'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { BottomNav } from '@/components/bottom-nav'

interface UserInfo {
  id: number; telegramId: string; username?: string; firstName?: string; lastName?: string
  balance: string; createdAt: string
}

interface OrderStats {
  all: number; pending: number; processing: number; completed: number
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [stats, setStats] = useState<OrderStats>({ all: 0, pending: 0, processing: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/user').then(r => r.json()).catch(() => null),
      fetch('/api/orders').then(r => r.json()).catch(() => []),
    ]).then(([userData, ordersData]) => {
      if (userData?.id) setUser(userData)
      if (Array.isArray(ordersData)) {
        setStats({
          all: ordersData.length,
          pending: ordersData.filter((o: {status:string}) => o.status === 'PENDING').length,
          processing: ordersData.filter((o: {status:string}) => o.status === 'PROCESSING').length,
          completed: ordersData.filter((o: {status:string}) => o.status === 'COMPLETED').length,
        })
      }
    }).finally(() => setLoading(false))
  }, [])

  const displayName = user ? (user.firstName || user.username || `用户${user.telegramId?.slice(-4)}`) : '加载中'
  const regDate = user ? new Date(user.createdAt).toISOString().slice(0, 10) : ''

  const orderEntries = [
    { label: '全部', count: stats.all,        href: '/orders?status=ALL',        statusKey: 'ALL' },
    { label: '待支付', count: stats.pending,   href: '/orders?status=PENDING',    statusKey: 'PENDING' },
    { label: '处理中', count: stats.processing,href: '/orders?status=PROCESSING', statusKey: 'PROCESSING' },
    { label: '已完成', count: stats.completed, href: '/orders?status=COMPLETED',  statusKey: 'COMPLETED' },
  ]

  const orderIcons = [
    // 全部
    <svg key="all" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>,
    // 待支付
    <svg key="pending" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>,
    // 处理中
    <svg key="processing" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10"/>
      <polyline points="16.24 7.76 12 12 16 16"/>
    </svg>,
    // 已完成
    <svg key="completed" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>,
  ]

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100dvh' }}>
      <AppHeader title="我的" subtitle="小程序" />

      <div style={{ padding: `calc(80px + env(safe-area-inset-top)) 20px calc(76px + env(safe-area-inset-bottom) + 16px)` }}>
        {/* 用户信息卡片 */}
        <div style={{ marginBottom: 16 }}>
          <div className="green-gradient" style={{
            borderRadius: 28,
            padding: '24px 22px 22px',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 240,
          }}>
            {/* 装饰圆弧 */}
            <div style={{ position: 'absolute', right: -50, top: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', left: -40, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

            {/* 用户信息 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20, position: 'relative' }}>
              {/* 头像 */}
              <div style={{
                width: 88, height: 88, borderRadius: 26,
                background: 'rgba(255,255,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 38,
              }}>
                {loading ? (
                  <div className="spinner" style={{ width: 28, height: 28, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 20, fontWeight: 800 }}>{displayName}</span>
                  <span style={{
                    background: 'rgba(255,255,255,0.28)', fontSize: 10,
                    padding: '2px 8px', borderRadius: 999, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    已认证
                  </span>
                </div>
                {user && (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 3 }}>ID: {user.telegramId}</p>
                )}
                {regDate && (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>注册于 {regDate}</p>
                )}
              </div>
            </div>

            {/* 分割线 */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: 18, position: 'relative' }} />

            {/* 余额区域 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 14,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>账户余额</p>
                <p style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>¥{user ? Number(user.balance).toFixed(2) : '0.00'}</p>
              </div>
              <button style={{
                background: '#fff',
                color: '#2EA66F',
                fontWeight: 800,
                fontSize: 14,
                border: 'none',
                borderRadius: 999,
                padding: '10px 22px',
                cursor: 'pointer',
              }}>充値</button>
            </div>
          </div>
        </div>

        {/* 我的订单卡片 */}
        <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 14px rgba(0,0,0,0.065)', padding: '18px 18px 20px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#10201A' }}>我的订单</span>
            <Link href="/orders" style={{ fontSize: 13, color: '#2EA66F', textDecoration: 'none', fontWeight: 600 }}>查看全部 ›</Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {orderEntries.map((entry, idx) => (
              <Link key={entry.label} href={entry.href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: '#E8F7F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#2EA66F',
                  }}>
                    {orderIcons[idx]}
                  </div>
                  {entry.count > 0 && (
                    <span style={{
                      position: 'absolute', top: -3, right: -4,
                      background: '#F85050',
                      color: '#fff',
                      fontSize: 10, fontWeight: 700,
                      minWidth: 16, height: 16, borderRadius: 999,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 4px',
                    }}>{entry.count}</span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: '#6B7C73', fontWeight: 500 }}>{entry.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 联系客服卡片 */}
        <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 14px rgba(0,0,0,0.065)', padding: '0 18px' }}>
          <button style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
            padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: '#F2F2F4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, color: '#6B7C73',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.21 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
              </svg>
            </div>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#10201A', textAlign: 'left' }}>联系客服</span>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1 1l5 5-5 5" stroke="#C8D4CC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
