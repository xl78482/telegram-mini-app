'use client'
import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { AppHeader } from '@/components/AppHeader'
import { OrderCard } from '@/components/OrderCard'
import { EmptyState } from '@/components/EmptyState'
import { useInitData } from '@/hooks/use-init-data'
import Link from 'next/link'
import { Search } from 'lucide-react'

interface Order {
  id: number; orderNo: string; status: string; totalAmount: string; createdAt: string
  items: { name: string; quantity: number; product?: { images?: string | null } | null }[]
}

const STATUS_FILTERS = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING', label: '待付款' },
  { key: 'PROCESSING', label: '处理中' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'CANCELLED', label: '已取消' },
]

export default function OrdersPage() {
  const initData = useInitData()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!initData) return
    fetch('/api/orders', { headers: { 'x-init-data': initData } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setOrders(data) })
      .finally(() => setLoading(false))
  }, [initData])

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter
    const matchSearch = !search || o.orderNo.includes(search) || o.items.some(i => i.name.includes(search))
    return matchStatus && matchSearch
  })

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100vh' }}>
      <AppHeader title="我的订单" subtitle="订单中心" />

      <div style={{ padding: '16px 20px', paddingBottom: 'calc(76px + env(safe-area-inset-bottom) + 16px)' }}>
        {/* 筛选卡片 */}
        <div style={{
          background: '#fff', borderRadius: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          padding: '20px 16px 16px', marginBottom: 16,
        }}>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#10201A', marginBottom: 14 }}>我的订单</p>

          {/* 状态筛选 */}
          <div className="category-scroll" style={{ marginBottom: 14 }}>
            {STATUS_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                style={{
                  flexShrink: 0, padding: '7px 14px', borderRadius: 999,
                  fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: statusFilter === f.key ? '#E8F7F0' : 'transparent',
                  color: statusFilter === f.key ? '#2EA66F' : '#6B7C73',
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 搜索框 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#F6F6F8', borderRadius: 999, padding: '10px 14px',
          }}>
            <Search size={15} color="#8A9690" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索订单号 / 商品名称"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 14, color: '#10201A',
              }}
            />
          </div>
        </div>

        {/* 订单列表 */}
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 160, marginBottom: 14, borderRadius: 20 }} />
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📋"
            title="暂无订单"
            description="您还没有相关订单"
            action={
              <Link href="/" style={{
                display: 'inline-block', padding: '10px 24px', borderRadius: 999,
                background: '#2EA66F', color: '#fff', fontSize: 14, fontWeight: 600,
                textDecoration: 'none',
              }}>去购物</Link>
            }
          />
        ) : (
          filtered.map(order => <OrderCard key={order.id} order={order} />)
        )}
      </div>

      <BottomNav />
    </div>
  )
}
