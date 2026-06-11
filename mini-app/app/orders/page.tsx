'use client'
import { useEffect, useState } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { BottomNav } from '@/components/bottom-nav'
import { OrderCard } from '@/components/OrderCard'
import { EmptyState } from '@/components/EmptyState'

interface Order {
  id: number; orderNo: string; status: string; totalAmount: string;
  paymentMethod?: string; createdAt: string;
  items: { name: string; quantity: number; price: string; product?: { images?: string | null } | null }[]
}

const STATUS_TABS = [
  { key: 'ALL',        label: '全部' },
  { key: 'PENDING',    label: '待付款' },
  { key: 'PROCESSING', label: '处理中' },
  { key: 'COMPLETED',  label: '已完成' },
  { key: 'CANCELLED',  label: '已取消' },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setOrders(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = orders.filter(o => {
    const matchStatus = activeStatus === 'ALL' || o.status === activeStatus
    const matchSearch = !search || o.orderNo.includes(search) || o.items.some(i => i.name.includes(search))
    return matchStatus && matchSearch
  })

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100dvh' }}>
      <AppHeader title="订单" subtitle="小程序" />

      <div style={{
        paddingTop: 'calc(80px + env(safe-area-inset-top) + 16px)',
        paddingBottom: 'calc(76px + env(safe-area-inset-bottom) + 16px)',
        paddingLeft: 20,
        paddingRight: 20,
      }}>
        {/* 顶部筛选卡片 */}
        <div style={{
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 2px 14px rgba(0,0,0,0.065)',
          padding: '20px 18px 18px',
          marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#10201A', marginBottom: 16 }}>我的订单</h2>

          {/* 状态筛选 */}
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto',
            paddingBottom: 2, marginBottom: 14, scrollbarWidth: 'none',
          }}>
            {STATUS_TABS.map(tab => {
              const active = activeStatus === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveStatus(tab.key)}
                  style={{
                    flexShrink: 0,
                    padding: '7px 16px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? '#E8F7F0' : '#F2F2F4',
                    color: active ? '#2EA66F' : '#6B7C73',
                    transition: 'all 0.15s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >{tab.label}</button>
              )
            })}
          </div>

          {/* 搜索框 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#F2F2F4', borderRadius: 999,
            padding: '10px 16px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A9690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="搜索订单号 / 商品名称"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 14, color: '#10201A',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A9690', fontSize: 18, lineHeight: 1, padding: 0 }}
              >×</button>
            )}
          </div>
        </div>

        {/* 订单列表 */}
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 170, marginBottom: 14, borderRadius: 24 }} />
          ))
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 14px rgba(0,0,0,0.055)' }}>
            <EmptyState
              title={search ? '未找到相关订单' : '暂无订单'}
              description={search ? '试试其他搜索关键词' : '快去逛逛商城，找到心仪商品吧'}
            />
          </div>
        ) : (
          filtered.map(order => <OrderCard key={order.id} order={order} />)
        )}
      </div>

      <BottomNav />
    </div>
  )
}
