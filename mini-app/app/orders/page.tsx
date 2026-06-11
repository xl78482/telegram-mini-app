'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
import { StatusBadge } from '@/components/status-badge'
import { useInitData } from '@/hooks/use-init-data'
import { ChevronRight } from 'lucide-react'

interface Order {
  id: number; orderNo: string; status: string; totalAmount: string; createdAt: string
  items: { name: string; quantity: number }[]
}

export default function OrdersPage() {
  const initData = useInitData()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!initData) return
    fetch('/api/orders', { headers: { 'x-init-data': initData } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setOrders(data) })
      .finally(() => setLoading(false))
  }, [initData])

  return (
    <>
      <div className="sticky top-0 z-10 bg-[#000]/80 backdrop-blur-md px-4 py-4">
        <h1 className="text-xl font-bold">我的订单</h1>
      </div>
      <div className="px-4 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#1c1c1e]" />
          ))
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <span className="text-5xl mb-4">📋</span>
            <p>暂无订单</p>
            <Link href="/" className="mt-4 text-blue-400 text-sm">去逛逛</Link>
          </div>
        ) : (
          orders.map(order => (
            <Link key={order.id} href={`/orders/${order.id}`}
              className="block rounded-2xl bg-[#1c1c1e] p-4 active:opacity-70">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">#{order.orderNo}</span>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-sm text-gray-300 truncate">
                {order.items.map(i => `${i.name} x${i.quantity}`).join('、')}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('zh-CN')}</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-white">¥{Number(order.totalAmount).toFixed(2)}</span>
                  <ChevronRight size={14} className="text-gray-600" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      <BottomNav />
    </>
  )
}
