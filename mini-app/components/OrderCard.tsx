'use client'
import Image from 'next/image'
import Link from 'next/link'
import { StatusBadge } from './StatusBadge'

interface Order {
  id: number
  orderNo: string
  status: string
  totalAmount: string
  createdAt: string
  items: { name: string; quantity: number; product?: { images?: string | null } | null }[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function OrderCard({ order }: { order: Order }) {
  const firstItem = order.items[0]
  const images = firstItem?.product?.images ? (JSON.parse(firstItem.product.images) as string[]) : []
  const thumb = images[0] ?? null

  return (
    <div style={{
      background: '#fff',
      borderRadius: 24,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      padding: '18px 16px',
      marginBottom: 14,
    }}>
      {/* 顶部：订单号 + 状态 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: '#8A9690', fontFamily: 'monospace' }}>订单号：{order.orderNo}</p>
        <StatusBadge status={order.status} />
      </div>

      {/* 商品信息 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, overflow: 'hidden', flexShrink: 0, background: '#F0FAF5', position: 'relative' }}>
          {thumb ? (
            <Image src={thumb} alt={firstItem?.name ?? ''} fill sizes="56px" style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#10201A', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {firstItem?.name ?? '商品'}
            {order.items.length > 1 && <span style={{ color: '#8A9690', fontWeight: 400 }}> 等{order.items.length}件</span>}
          </p>
          <p style={{ fontSize: 12, color: '#8A9690' }}>
            数量 {order.items.reduce((s, i) => s + i.quantity, 0)} · 余额 · {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      {/* 金额 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: '#8A9690' }}>实付 </span>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#2EA66F', marginLeft: 4 }}>¥{Number(order.totalAmount).toFixed(2)}</span>
      </div>

      {/* 虚线 */}
      <hr className="divider-dashed" />

      {/* 底部按钮 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button style={{
          padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
          background: '#fff', border: '1.5px solid #2EA66F', color: '#2EA66F', cursor: 'pointer',
        }}>联系客服</button>
        <Link href={`/orders/${order.id}`} style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
            background: '#2EA66F', border: 'none', color: '#fff', cursor: 'pointer',
          }}>查看详情</button>
        </Link>
      </div>
    </div>
  )
}
