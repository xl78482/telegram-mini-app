'use client'
/* BUILD: 2026-06-11-v3 */
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import EmptyState from '../../components/EmptyState'
import { apiFetch } from '../../lib/api-fetch'

const STATUS_TABS = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING', label: '待支付' },
  { key: 'PAID', label: '已支付' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'CANCELLED', label: '已取消' },
]

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:    { label: '待支付', bg: '#FFF4E5', color: '#F59E0B' },
  PAID:       { label: '已支付', bg: '#EEF3FF', color: '#4F74E8' },
  PROCESSING: { label: '处理中', bg: '#EEF3FF', color: '#4F74E8' },
  COMPLETED:  { label: '已完成', bg: '#E8F7EE', color: '#2EA66F' },
  CANCELLED:  { label: '已取消', bg: '#F5F5F5', color: '#8A9690' },
}

interface OrderItem { name: string; productName?: string; specName?: string | null; quantity: number; price: string | number }
interface Order {
  id: number; status: string; paymentMethod?: string | null
  createdAt: string; totalAmount?: string | number; expiresAt?: string | null
  cancelReason?: string | null; items?: OrderItem[]
}

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    function calc() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setLabel('已超时'); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setLabel(`${m}:${String(s).padStart(2, '0')} 后超时`)
    }
    calc(); const t = setInterval(calc, 1000); return () => clearInterval(t)
  }, [expiresAt])
  return <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>{label}</span>
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [search, setSearch] = useState('')
  const [cancelling, setCancelling] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Order[]>('/api/orders')
      setOrders(Array.isArray(data) ? data : [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCancel(e: React.MouseEvent, orderId: number) {
    e.stopPropagation()
    setCancelling(orderId)
    try {
      await apiFetch(`/api/orders/${orderId}/cancel`, { method: 'POST' })
      await load()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '取消失败')
    } finally { setCancelling(null) }
  }

  const filtered = orders.filter(o => {
    if (activeStatus !== 'ALL' && o.status !== activeStatus) return false
    if (search) {
      const idMatch = o.id?.toString().includes(search)
      const nameMatch = o.items?.[0]?.productName?.includes(search) || o.items?.[0]?.name?.includes(search)
      if (!idMatch && !nameMatch) return false
    }
    return true
  })

  return (
    <div className="tg-page" style={{ background: '#F6F6F8' }}>

      {/* 页面头部区域——使用 var(--app-content-top) 避开 Telegram 控制按钒 */}
      <div style={{ padding: 'var(--app-content-top) var(--page-padding-x) 0' }}>
        <div style={{ paddingTop: 'var(--page-header-gap)' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#10201A' }}>我的订单</span>
        </div>

        {/* 搜索框 */}
        <div style={{
          marginTop: 14,
          display: 'flex', alignItems: 'center',
          background: 'white', borderRadius: 14,
          padding: '10px 14px', gap: 10,
          boxShadow: '0 1px 6px rgba(16,32,26,0.05)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#8A9690" strokeWidth="2" />
            <path d="M20 20L17 17" stroke="#8A9690" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索订单号 / 商品名"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#10201A', background: 'transparent' }} />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#8A9690', fontSize: 16 }}>×</button>
          )}
        </div>

        {/* 状态筛选标签 */}
        <div className="no-scrollbar" style={{ display: 'flex', gap: 8, padding: '12px 0 4px', overflowX: 'auto' }}>
          {STATUS_TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveStatus(tab.key)} style={{
              padding: '6px 16px', borderRadius: 999, fontSize: 13,
              fontWeight: activeStatus === tab.key ? 700 : 500,
              background: activeStatus === tab.key ? '#32B579' : '#F3F4F6',
              color: activeStatus === tab.key ? 'white' : '#6B7C73',
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* 订单列表 */}
      <div style={{ padding: '8px var(--page-padding-x) 0' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: 20, padding: 16, boxShadow: '0 1px 8px rgba(16,32,26,0.06)' }}>
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
              const status = STATUS_MAP[order.status] ?? { label: order.status, bg: '#F5F5F5', color: '#8A9690' }
              const firstItem = order.items?.[0]
              const displayName = firstItem?.productName || firstItem?.name || ''
              const amount = Number(order.totalAmount ?? 0)
              const isPending = order.status === 'PENDING'
              const isCancelled = order.status === 'CANCELLED'
              return (
                <div key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  style={{
                    background: 'white', borderRadius: 20, padding: 16, cursor: 'pointer',
                    boxShadow: '0 1px 8px rgba(16,32,26,0.06)',
                  }}
                  onTouchStart={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.985)' }}
                  onTouchEnd={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#8A9690' }}>订单 #{order.id}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700, background: status.bg, color: status.color,
                      padding: '3px 10px', borderRadius: 999,
                    }}>{isCancelled && order.cancelReason === 'TIMEOUT' ? '超时取消' : status.label}</span>
                  </div>
                  {displayName && (
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#10201A', marginBottom: 4 }}>
                      {displayName}
                      {firstItem?.specName && <span style={{ fontSize: 12, color: '#32B579' }}> · {firstItem.specName}</span>}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 12, color: '#8A9690' }}>
                        {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                      {isPending && order.expiresAt && <ExpiryBadge expiresAt={order.expiresAt} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isPending && (
                        <button
                          onClick={e => handleCancel(e, order.id)}
                          disabled={cancelling === order.id}
                          style={{
                            padding: '5px 12px', borderRadius: 999,
                            border: '1.5px solid #E0E0E0', background: 'transparent',
                            fontSize: 12, color: cancelling === order.id ? '#8A9690' : '#E53935',
                            cursor: cancelling === order.id ? 'not-allowed' : 'pointer',
                          }}
                        >{cancelling === order.id ? '...' : '取消'}</button>
                      )}
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#32B579' }}>
                        ¥{amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
