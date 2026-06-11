'use client'
import { useEffect, useState } from 'react'

const STATUSES = ['PENDING','PAID','PROCESSING','COMPLETED','CANCELLED']
const PAYMENT_STATUSES = ['PENDING','SUCCESS','FAILED','EXPIRED']
const PAYMENT_CHANNELS = ['BALANCE','EPUSDT','OKPAY']

const statusLabel: Record<string, string> = {
  PENDING: '待支付', PAID: '已支付', PROCESSING: '处理中', COMPLETED: '已完成', CANCELLED: '已取消'
}
const payStatusLabel: Record<string, string> = {
  PENDING: '待支付', SUCCESS: '已支付', FAILED: '支付失败', EXPIRED: '已过期'
}
const paymentChannelLabel: Record<string, string> = {
  BALANCE: '余额', EPUSDT: 'USDT', OKPAY: 'OKPay'
}

const statusColor: Record<string, string> = {
  PENDING: 'text-yellow-400 bg-yellow-500/15',
  PAID: 'text-blue-400 bg-blue-500/15',
  PROCESSING: 'text-purple-400 bg-purple-500/15',
  COMPLETED: 'text-green-400 bg-green-500/15',
  CANCELLED: 'text-gray-400 bg-gray-500/15',
}
const payStatusColor: Record<string, string> = {
  PENDING: 'text-yellow-400 bg-yellow-500/15',
  SUCCESS: 'text-green-400 bg-green-500/15',
  FAILED: 'text-red-400 bg-red-500/15',
  EXPIRED: 'text-gray-400 bg-gray-500/15',
}

interface Order {
  id: number; orderNo: string; status: string; payStatus: string; paymentMethod?: string | null;
  totalAmount: string; usdtAmount?: string | null; createdAt: string; paidAt?: string | null;
  user: { firstName?: string | null; username?: string | null }
  items: { name: string; quantity: number; price: string }[]
  deliveryCount: number
}

interface CardSecret {
  id: number
  content: string
  status: string
  soldAt?: string | null
}

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('')
  const [updating, setUpdating] = useState<number | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderCards, setOrderCards] = useState<CardSecret[]>([])
  const [loadingCards, setLoadingCards] = useState(false)

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

  async function viewOrderCards(order: Order) {
    setSelectedOrder(order)
    setLoadingCards(true)
    setOrderCards([])
    try {
      const data = await fetch(`/api/admin/orders/${order.id}/cards`).then(r => r.json())
      if (Array.isArray(data)) setOrderCards(data)
    } catch {
      setOrderCards([])
    } finally {
      setLoadingCards(false)
    }
  }

  function maskCardContent(content: string): string {
    if (content.length <= 8) return content.slice(0, 2) + '****' + content.slice(-2)
    return content.slice(0, 4) + '****' + content.slice(-4)
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
              <th className="px-4 py-3 text-center">支付方式</th>
              <th className="px-4 py-3 text-center">支付状态</th>
              <th className="px-4 py-3 text-center">发卡数</th>
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
                <td className="px-4 py-3 text-right font-medium">
                  ¥{Number(o.totalAmount).toFixed(2)}
                  {o.paymentMethod === 'EPUSDT' && o.usdtAmount && (
                    <span className="text-xs text-gray-500 ml-1">({Number(o.usdtAmount).toFixed(2)} USDT)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="rounded-full px-2 py-0.5 text-xs bg-white/5 text-gray-300">
                    {o.paymentMethod ? paymentChannelLabel[o.paymentMethod] ?? o.paymentMethod : '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${payStatusColor[o.payStatus] ?? 'text-gray-400 bg-gray-500/15'}`}>
                    {payStatusLabel[o.payStatus] ?? o.payStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs text-gray-400">{o.deliveryCount}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  <div>{new Date(o.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                  {o.paidAt && (
                    <div className="text-green-400">支付: {new Date(o.paidAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                  )}
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <select
                    value={o.status}
                    disabled={updating === o.id}
                    onChange={e => updateStatus(o.id, e.target.value)}
                    className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs text-white outline-none disabled:opacity-50"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
                  </select>
                  {o.deliveryCount > 0 && (
                    <button
                      onClick={() => viewOrderCards(o)}
                      className="rounded-lg bg-blue-500/20 border border-blue-500/30 px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/30"
                    >
                      查看卡密
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 卡密详情弹窗 */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#111] rounded-2xl border border-white/10 p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">订单 {selectedOrder.orderNo} 卡密</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            {loadingCards ? (
              <div className="text-center text-gray-400 py-8">加载中...</div>
            ) : orderCards.length === 0 ? (
              <div className="text-center text-gray-400 py-8">暂无卡密</div>
            ) : (
              <div className="space-y-3">
                {orderCards.map((card, i) => (
                  <div key={card.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">卡密 #{i + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${card.status === 'SOLD' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                        {card.status === 'SOLD' ? '已售出' : card.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm font-mono text-white break-all">{card.content}</div>
                    {card.soldAt && (
                      <div className="mt-1 text-xs text-gray-500">售出时间: {new Date(card.soldAt).toLocaleString('zh-CN')}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-4 w-full py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}