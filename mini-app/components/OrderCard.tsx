'use client'
import Image from 'next/image'
import Link from 'next/link'
import { StatusBadge } from './StatusBadge'

interface OrderItem {
  name: string
  quantity: number
  price: string
  product?: { images?: string | null } | null
}

interface Order {
  id: number
  orderNo: string
  status: string
  totalAmount: string
  paymentMethod?: string
  createdAt: string
  items: OrderItem[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function OrderCard({ order }: { order: Order }) {
  const firstItem = order.items[0]
  const images = firstItem?.product?.images
    ? (() => { try { return JSON.parse(firstItem.product!.images!) as string[] } catch { return [] } })()
    : []
  const thumb = images[0] ?? null
  const isUsdt = order.paymentMethod === 'usdt'
  const isOkpay = order.paymentMethod === 'okpay'
  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0)
  const payLabel = isUsdt ? 'USDT' : isOkpay ? 'OKPay' : '余额'

  return (
    <div style={{
      background: '#fff',
      borderRadius: 24,
      boxShadow: '0 2px 14px rgba(0,0,0,0.055)',
      padding: '18px 16px 16px',
      marginBottom: 14,
    }}>
      {/* 顶部：订单号 + 状态 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 11.5, color: '#8A9690', fontFeatureSettings: '"tnum"' }}
        >订单号：{order.orderNo}</p>
        <StatusBadge status={order.status} />
      </div>

      {/* 商品信息 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          overflow: 'hidden', flexShrink: 0,
          background: '#F0FAF5', position: 'relative',
        }}>
          {thumb ? (
            <Image src={thumb} alt={firstItem?.name ?? ''} fill sizes="56px" style={{ objectFit: 'cover' }} unoptimized />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#2EA66F',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              </svg>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14, fontWeight: 700, color: '#10201A', marginBottom: 5,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {firstItem?.name ?? '商品'}
            {order.items.length > 1 && <span style={{ color: '#8A9690', fontWeight: 400 }}> 等{order.items.length}件</span>}
          </p>
          <p style={{ fontSize: 12, color: '#8A9690' }}>
            数量 {totalQty} · {payLabel} · {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      {/* 金额 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 4, gap: 4 }}>
        <span style={{ fontSize: 13, color: '#8A9690' }}>实付</span>
        {isUsdt || isOkpay ? (
          <>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#3B6FE0' }}>
              {Number(order.totalAmount).toFixed(2)} {isUsdt ? 'USDT' : 'OKPay'}
            </span>
            <span style={{ fontSize: 12, color: '#8A9690' }}>约 ¥{Number(order.totalAmount).toFixed(2)}</span>
          </>
        ) : (
          <span style={{ fontSize: 15, fontWeight: 800, color: '#2EA66F' }}>¥{Number(order.totalAmount).toFixed(2)}</span>
        )}
      </div>

      {/* 虚线 */}
      <hr className="divider-dashed" />

      {/* 底部按钮 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button style={{
          padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600,
          background: '#fff', border: '1.5px solid #2EA66F', color: '#2EA66F', cursor: 'pointer',
        }}>联系客服</button>
        <Link href={`/orders/${order.id}`} style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700,
            background: '#2EA66F', border: 'none', color: '#fff', cursor: 'pointer',
          }}>查看详情</button>
        </Link>
      </div>
    </div>
  )
}
