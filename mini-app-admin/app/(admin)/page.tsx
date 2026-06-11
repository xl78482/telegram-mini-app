'use client'
import { useEffect, useState } from 'react'
import { Users, ShoppingBag, DollarSign, Package } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Stats {
  totalUsers: number; totalOrders: number; totalRevenue: string; totalStock: number
  dailyOrders: { date: string; count: number }[]
  recentOrders: { id: number; orderNo: string; totalAmount: string; status: string; user: { firstName?: string | null; username?: string | null } }[]
}

const statusLabel: Record<string, string> = {
  PENDING: '待支付', PAID: '已支付', PROCESSING: '处理中', COMPLETED: '已完成', CANCELLED: '已取消'
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats)
  }, [])

  const kpis = stats ? [
    { label: '总用户',   value: stats.totalUsers,             icon: Users,       color: 'text-blue-400',   bg: 'bg-blue-500/10' },
    { label: '总订单',   value: stats.totalOrders,            icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: '总收入',   value: `¥${stats.totalRevenue}`,  icon: DollarSign,  color: 'text-green-400',  bg: 'bg-green-500/10' },
    { label: '总库存',   value: stats.totalStock,             icon: Package,     color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ] : []

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">数据概览</h1>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats ? kpis.map(k => (
          <div key={k.label} className="rounded-2xl border border-white/10 bg-[#111] p-4">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${k.bg}`}>
              <k.icon className={k.color} size={20} />
            </div>
            <p className="text-2xl font-bold text-white">{k.value}</p>
            <p className="text-sm text-gray-500">{k.label}</p>
          </div>
        )) : [...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#1a1a1a]" />
        ))}
      </div>

      {/* 订单趋势图 */}
      <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
        <h2 className="mb-4 text-sm font-medium text-gray-400">迗 7 天订单趋势</h2>
        {stats ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #ffffff15', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="h-52 animate-pulse rounded-xl bg-[#1a1a1a]" />}
      </div>

      {/* 最近订单 */}
      <div className="rounded-2xl border border-white/10 bg-[#111]">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-medium text-gray-400">最近订单</h2>
        </div>
        <div className="divide-y divide-white/5">
          {stats ? stats.recentOrders.map(o => (
            <div key={o.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm text-white font-mono">{o.orderNo}</p>
                <p className="text-xs text-gray-500">{o.user.firstName ?? o.user.username ?? 'Unknown'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">¥{o.totalAmount}</p>
                <p className="text-xs text-gray-500">{statusLabel[o.status] ?? o.status}</p>
              </div>
            </div>
          )) : <div className="h-40 animate-pulse" />}
        </div>
      </div>
    </div>
  )
}
