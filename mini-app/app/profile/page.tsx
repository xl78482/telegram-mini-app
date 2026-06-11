'use client'
import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { AppHeader } from '@/components/AppHeader'
import { useInitData } from '@/hooks/use-init-data'
import { Wallet, ChevronRight, ShoppingBag, Clock, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: number; tgId: string; username?: string | null
  firstName?: string | null; lastName?: string | null
  balance: string; createdAt?: string
}

export default function ProfilePage() {
  const initData = useInitData()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!initData) return
    fetch('/api/user', { headers: { 'x-init-data': initData } })
      .then(r => r.json())
      .then(data => { if (data.id) setUser(data) })
      .finally(() => setLoading(false))
  }, [initData])

  const displayName = user ? (user.firstName ?? '') + (user.lastName ? ' ' + user.lastName : '') || user.username || '用户' : '...'
  const initials = displayName.charAt(0).toUpperCase()

  const orderEntries = [
    { label: '全部', icon: '📋', href: '/orders?status=ALL' },
    { label: '待支付', icon: '⏳', href: '/orders?status=PENDING' },
    { label: '处理中', icon: '⚙️', href: '/orders?status=PROCESSING' },
    { label: '已完成', icon: '✅', href: '/orders?status=COMPLETED' },
  ]

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100vh' }}>
      <AppHeader title="个人中心" subtitle="我的账户" />

      <div style={{ padding: '20px 20px', paddingBottom: 'calc(76px + env(safe-area-inset-bottom) + 16px)' }}>

        {/* 绿色用户信息卡片 */}
        <div className="green-gradient" style={{
          borderRadius: 28, padding: '24px 20px 20px', color: '#fff', marginBottom: 16,
          position: 'relative', overflow: 'hidden', minHeight: 260,
        }}>
          {/* 装饰圆 */}
          <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ position: 'absolute', right: 40, bottom: -60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

          {/* 顶部用户信息 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            {/* 头像 */}
            <div style={{
              width: 72, height: 72, borderRadius: 22,
              background: 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>{initials}</div>

            {/* 信息 */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 800 }}>{displayName}</span>
                <span style={{ background: 'rgba(255,255,255,0.25)', fontSize: 10, padding: '2px 6px', borderRadius: 999 }}>✓ 认证</span>
              </div>
              {user?.tgId && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 2 }}>ID: {user.tgId}</p>}
              {user?.createdAt && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                  注册于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                </p>
              )}
            </div>
          </div>

          {/* 分割线 */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', margin: '0 0 16px' }} />

          {/* 余额区域 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Wallet size={18} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>账户余额</p>
                <p style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
                  ¥{user ? Number(user.balance).toFixed(2) : '--'}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setMsg('请联系客服充值'); setTimeout(() => setMsg(''), 3000) }}
              style={{
                background: '#fff', color: '#2EA66F', fontSize: 14, fontWeight: 700,
                border: 'none', borderRadius: 999, padding: '10px 22px', cursor: 'pointer',
              }}
            >
              充值
            </button>
          </div>
          {msg && <p style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{msg}</p>}
        </div>

        {/* 我的订单卡片 */}
        <div style={{
          background: '#fff', borderRadius: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          padding: '18px 16px', marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#10201A' }}>我的订单</span>
            <Link href="/orders" style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 13, color: '#8A9690', textDecoration: 'none' }}>
              查看全部
              <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {orderEntries.map(entry => (
              <Link key={entry.label} href={entry.href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 16,
                    background: '#E8F7F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>{entry.icon}</div>
                  <span style={{ fontSize: 12, color: '#6B7C73', fontWeight: 500 }}>{entry.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 联系客服卡片 */}
        <div style={{
          background: '#fff', borderRadius: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          padding: '16px', marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, background: '#F0F0F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>🎧</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#10201A' }}>联系客服</p>
              <p style={{ fontSize: 12, color: '#8A9690', marginTop: 2 }}>7×24小时在线服务</p>
            </div>
            <ChevronRight size={18} color="#C8D4CC" />
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
