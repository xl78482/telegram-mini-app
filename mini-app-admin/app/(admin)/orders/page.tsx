'use client'
import { useEffect, useState } from 'react'

const STATUSES = ['PENDING','PAID','PROCESSING','COMPLETED','CANCELLED']
const statusLabel: Record<string, string> = {
  PENDING: '待支付', PAID: '已支付', PROCESSING: '处理中', COMPLETED: '已完成', CANCELLED: '已取消'
}
const statusColor: Record<string, string> = {
  PENDING: 'text-yellow-400 bg-yellow-500/15',
  PAID: 'text-blue-400 bg-blue-500/15',
  PROCESSING: 'text-purple-400 bg-purple-500/15',
  COMPLETED: 'text-green-400 bg-green-500/15',
  CANCELLED: 'text-gray-400 bg-gray-500/15',
}

interface Order {
  id: number; orderNo: string; status: string; totalAmount: string; createdAt: string
  user: { firstName?: string | null; username?: string | null }
  items: { name: string; quantity: number }[]
}

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('')
  const [updating, setUpdating] = useState<number | null>(null)

  async function load() {
    const url = filter ? `/api/admin/orders?status=${filter}` : '/api/admin/orders'
    const data = await fetch(url).then(r => r.json())
    if (Array.isArray(data)) setOrders(data)
  }

  useEffect(() => { load() }, [filter])

  async function updateStatus(id: number, status: string) {
    setUpdating(id)
    try {
      await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await load()
    } finally { setUpdating(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">订单管理</h1>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none">
          <option value="">全部</option>
          {STATUSES.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-500">
              <th className="px-4 py-3 text-left">订单号</th>
              <th className="px-4 py-3 text-left">用户</th>
              <th className="px-4 py-3 text-left">商品</th>
              <th className="px-4 py-3 text-right">金额</th>
              <th className="px-4 py-3 text-center">状态</th>
              <th className="px-4 py-3 text-left">时间</th>
              <th className="px-4 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-white/3">
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{o.orderNo}</td>
                <td className="px-4 py-3 text-white">{o.user.firstName ?? o.user.username ?? '-'}</td>
                <td className="px-4 py-3 text-gray-300 max-w-[160px] truncate">
                  {o.items.map(i => `${i.name}x${i.quantity}`).join(', ')}
                </td>
                <td className="px-4 py-3 text-right font-medium">¥{Number(o.totalAmount).toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${statusColor[o.status]}`}>
                    {statusLabel[o.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(o.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    disabled={updating === o.id}
                    onChange={e => updateStatus(o.id, e.target.value)}
                    className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs text-white outline-none disabled:opacity-50"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
