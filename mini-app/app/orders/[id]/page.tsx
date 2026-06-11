'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Copy, Check } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { useInitData } from '@/hooks/use-init-data'

interface OrderItem { id: number; name: string; quantity: number; price: string; product: { images?: string | null } | null }
interface Order {
  id: number; orderNo: string; status: string; totalAmount: string
  remark?: string | null; createdAt: string; items: OrderItem[]
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const initData = useInitData()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!initData) return
    fetch(`/api/orders/${id}`, { headers: { 'x-init-data': initData } })
      .then(r => r.json()).then(setOrder).finally(() => setLoading(false))
  }, [id, initData])

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
    </div>
  )

  if (!order) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
      <p>订单不存在</p>
      <button onClick={() => router.back()} className="mt-4 text-blue-400">返回</button>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-[#000]/80 backdrop-blur-md px-4 py-3">
        <button onClick={() => router.back()} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
          <ChevronLeft size={18} />
        </button>
        <span className="font-medium">订单详情</span>
      </div>

      <div className="px-4 space-y-3 pt-2">
        {/* 状态卡片 */}
        <div className="rounded-2xl bg-[#1c1c1e] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">订单编号</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-white">{order.orderNo}</span>
                <button onClick={() => copy(order.orderNo)} className="text-gray-500">
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* 商品列表 */}
        <div className="rounded-2xl bg-[#1c1c1e] p-4">
          <p className="text-xs text-gray-500 mb-3">商品清单</p>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{item.name}</p>
                  <p className="text-xs text-gray-500">x{item.quantity}</p>
                </div>
                <span className="text-sm font-medium text-white">¥{(Number(item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-white/10 pt-3 flex justify-between">
            <span className="text-sm text-gray-400">合计</span>
            <span className="font-bold text-blue-400">¥{Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>

        {/* 时间 */}
        <div className="rounded-2xl bg-[#1c1c1e] p-4">
          <p className="text-xs text-gray-500 mb-1">下单时间</p>
          <p className="text-sm text-white">{new Date(order.createdAt).toLocaleString('zh-CN')}</p>
          {order.remark && (
            <><p className="text-xs text-gray-500 mb-1 mt-3">备注</p>
            <p className="text-sm text-gray-300">{order.remark}</p></>
          )}
        </div>
      </div>
    </div>
  )
}
