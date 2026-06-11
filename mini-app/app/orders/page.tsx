'use client'
/* BUILD: 2026-06-11-v4 */
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import EmptyState from '../../components/EmptyState'
import { apiFetch } from '../../lib/api-fetch'

const STATUS_TABS = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING', label: '待付款' },
  { key: 'PROCESSING', label: '处理中' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'CANCELLED', label: '已取消' },
]

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:    { label: '待付款', bg: '#FFF4E5', color: '#F59E0B' },
  PAID:       { label: '已支付', bg: '#EEF3FF', color: '#4F74E8' },
  PROCESSING: { label: '处理中', bg: '#EEF3FF', color: '#4F74E8' },
  COMPLETED:  { label: '已完成', bg: '#E8F7EE', color: '#2EA66F' },
  CANCELLED:  { label: '已取消', bg: '#F3F4F6', color: '#8A9690' },
}

interface OrderItem { name: string; productName?: string; specName?: string | null; quantity: number; price: string | number; image?: string | null }
interface Order {
  id: number; orderNo?: string; status: string; paymentMethod?: string | null
  createdAt: string; totalAmount?: string | number; expiresAt?: string | null
  cancelReason?: string | null; items?: OrderItem[]
}

function formatDateTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}年${p(d.getMonth() + 1)}月${p(d.getDate())}日 ${p(d.getHours())}:${p(d.getMinutes())}`
}

function payLabel(method?: string | null) {
  if (method === 'BALANCE') return '余额'
  if (method === 'USDT') return 'USDT'
  return method || '余额'
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

  const statusMatches = (orderStatus: string) => {
    if (activeStatus === 'ALL') return true
    if (activeStatus === 'PROCESSING') return orderStatus === 'PROCESSING' || orderStatus === 'PAID'
    return orderStatus === activeStatus
  }

  const filtered = orders.filter(o => {
    if (!statusMatches(o.status)) return false
    if (search) {
      const idMatch = (o.orderNo ?? o.id?.toString() ?? '').includes(search)
      const nameMatch = o.items?.[0]?.productName?.includes(search) || o.items?.[0]?.name?.includes(search)
      if (!idMatch && !nameMatch) return false
    }
    return true
  })

  return (
    <div className="tg-page" style={{ background: '#F6F6F8' }}>

      {/* 头部卡片：标题 + 标签 + 搜索 */}
      <div style={{ padding: 'calc(var(--app-content-top) + 12px) var(--page-padding-x) 0' }}>
        <div style={{
          background: 'white', borderRadius: 24, padding: '22px 18px 18px',
          boxShadow: '0 2px 12px rgba(16,32,26,0.06)',
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#10201A', marginBottom: 16 }}>我的订单</div>

          {/* 状态筛选标签 */}
          <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14 }}>
            {STATUS_TABS.map(tab => {
              const active = activeStatus === tab.key
              return (
                <button key={tab.key} onClick={() => setActiveStatus(tab.key)} style={{
                  padding: '7px 16px', borderRadius: 999, fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  background: active ? '#E8F7EE' : 'transparent',
                  color: active ? '#2EA66F' : '#6B7C73',
                  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}>{tab.label}</button>
              )
            })}
          </div>

          {/* 搜索框 */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: '#F4F5F7', borderRadius: 999,
            padding: '12px 16px', gap: 10,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="#8A9690" strokeWidth="2" />
              <path d="M20 20L17 17" stroke="#8A9690" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索订单号 / 商品名称"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#10201A', background: 'transparent' }} />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#8A9690', fontSize: 18 }}>×</button>
            )}
          </div>
        </div>
      </div>

      {/* 订单列表 */}
      <div style={{ padding: '14px var(--page-padding-x) 0' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: 22, padding: 18, boxShadow: '0 1px 8px rgba(16,32,26,0.06)' }}>
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 56, width: '100%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 14, width: '40%' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="暂无订单" description="还没有订单，去选购一件吧" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(order => {
              const status = STATUS_MAP[order.status] ?? { label: order.status, bg: '#F3F4F6', color: '#8A9690' }
              const isTimeout = order.status === 'CANCELLED' && order.cancelReason === 'TIMEOUT'
              const statusLabel = isTimeout ? '超时取消' : status.label
              const firstItem = order.items?.[0]
              const displayName = firstItem?.productName || firstItem?.name || '商品'
              const qty = firstItem?.quantity ?? 1
              const amount = Number(order.totalAmount ?? 0)
              const isPending = order.status === 'PENDING'
              const orderNo = order.orderNo ?? `O${order.id}`
              const itemImg: string | null = firstItem?.image ?? null

              return (
                <div key={order.id}
                  style={{
                    background: 'white', borderRadius: 22, padding: 18,
                    boxShadow: '0 1px 8px rgba(16,32,26,0.06)',
                  }}
                >
                  {/* 订单号 + 状态 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, color: '#8A9690' }}>
                      订单号：<span style={{ color: '#10201A', fontWeight: 600 }}>{orderNo}</span>
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: 700, background: status.bg, color: status.color,
                      padding: '4px 12px', borderRadius: 999,
                    }}>{statusLabel}</span>
                  </div>

                  {/* 商品信息 */}
                  <div
                    onClick={() => router.push(`/orders/${order.id}`)}
                    style={{ display: 'flex', gap: 14, cursor: 'pointer' }}
                  >
                    <div style={{
                      width: 58, height: 58, borderRadius: 14, flexShrink: 0,
                      background: '#F0F4F2', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {itemImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={itemImg} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                          <path d="M3 9H21L19.5 4H4.5L3 9Z" fill="#CFE9DB" />
                          <path d="M3 9V20H21V9" stroke="#9FD3BB" strokeWidth="1.6" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700, fontSize: 16, color: '#10201A', marginBottom: 6,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {displayName}
                      </div>
                      <div style={{ fontSize: 13, color: '#8A9690', marginBottom: 8 }}>
                        数量 {qty} · {payLabel(order.paymentMethod)} · {formatDateTime(order.createdAt)}
                      </div>
                      <div style={{ fontSize: 14, color: '#6B7C73' }}>
                        实付 <span style={{ fontSize: 18, fontWeight: 800, color: '#2EA66F' }}>¥{amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 分隔虚线 */}
                  <div style={{ borderTop: '1px dashed #ECEEF0', margin: '16px 0 0' }} />

                  {/* 操作按钮 */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 14 }}>
                    {isPending && (
                      <button
                        onClick={e => handleCancel(e, order.id)}
                        disabled={cancelling === order.id}
                        style={{
                          padding: '9px 22px', borderRadius: 999,
                          border: '1.5px solid #E0E0E0', background: 'white',
                          fontSize: 14, fontWeight: 600,
                          color: cancelling === order.id ? '#8A9690' : '#E53935',
                          cursor: cancelling === order.id ? 'not-allowed' : 'pointer',
                        }}
                      >{cancelling === order.id ? '...' : '取消订单'}</button>
                    )}
                    <button
                      onClick={() => alert('请联系客服')}
                      style={{
                        padding: '9px 22px', borderRadius: 999,
                        border: '1.5px solid #B7E3CC', background: 'white',
                        fontSize: 14, fontWeight: 600, color: '#2EA66F', cursor: 'pointer',
                      }}
                    >联系客服</button>
                    <button
                      onClick={() => router.push(`/orders/${order.id}`)}
                      style={{
                        padding: '9px 22px', borderRadius: 999, border: 'none',
                        background: '#3DAE74', fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer',
                      }}
                    >查看详情</button>
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
