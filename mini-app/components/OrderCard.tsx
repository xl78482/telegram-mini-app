'use client'
import Link from 'next/link'
import Image from 'next/image'
import { StatusBadge } from './status-badge'

interface OrderItem { name: string; quantity: number; product?: { images?: string | null } | null }
interface Order {
  id: number; orderNo: string; status: string; totalAmount: string
  createdAt: string; items: OrderItem[]
}

export function OrderCard({ order }: { order: Order }) {
  const firstItem = order.items[0]
  const images = firstItem?.product?.images ? JSON.parse(firstItem.product.images) as string[] : []
  const thumb = images[0] ?? null
  const dateStr = new Date(order.createdAt).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).replace(/\//g, '年').replace('-', '月') + ''

  return (
    <Link href={`/orders/${order.id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div style={{
        background: '#fff', borderRadius: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        padding: '16px 16px 0', marginBottom: 14,
        WebkitTapHighlightColor: 'transparent',
      }}>
        {/* 顶部：订单号 + 状态 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: '#8A9690' }}>订单号：{order.orderNo}</span>
          <StatusBadge status={order.status} />
        </div>

        {/* 商品信息 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12, overflow: 'hidden',
            background: '#F0FAF5', flexShrink: 0, position: 'relative',
          }}>
            {thumb ? (
              <Image src={thumb} alt={firstItem?.name ?? ''} fill style={{ objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#10201A', marginBottom: 4 }}>
              {order.items.map(i => i.name).join('、')}
            </p>
            <p style={{ fontSize: 12, color: '#8A9690' }}>
              数量 {order.items.reduce((s, i) => s + i.quantity, 0)} · 余额 · {dateStr}
            </p>
          </div>
        </div>

        {/* 金额 */}
        <div style={{ marginBottom: 12, textAlign: 'right' }}>
          <span style={{ fontSize: 13, color: '#6B7C73' }}>实付 </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#2EA66F' }}>¥{Number(order.totalAmount).toFixed(2)}</span>
        </div>

        {/* 分割线 + 底部按钮 */}
        <div style={{ borderTop: '1px dashed #EBEBEB', padding: '10px 0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={e => e.preventDefault()}
            style={{
              padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              border: '1.5px solid #2EA66F', background: 'transparent', color: '#2EA66F', cursor: 'pointer',
            }}
          >
            联系客服
          </button>
          <button
            style={{
              padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              border: 'none', background: '#2EA66F', color: '#fff', cursor: 'pointer',
            }}
          >
            查看详情
          </button>
        </div>
      </div>
    </Link>
  )
}
