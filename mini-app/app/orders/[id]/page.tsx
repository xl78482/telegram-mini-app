'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { AppHeader } from '@/components/AppHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { CopyButton } from '@/components/CopyButton'

interface OrderDetail {
  id: number
  orderNo: string
  status: string
  totalAmount: string
  paymentMethod?: string
  createdAt: string
  items: {
    id: number; name: string; quantity: number; price: string
    product?: { images?: string | null } | null
  }[]
  cardKeys?: string[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function OrderDetailPage() {
  const params = useParams()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then(r => r.json())
      .then(data => { if (data?.id) setOrder(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleCancel() {
    if (!order || cancelling) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, { method: 'POST' })
      if (res.ok) {
        const updated = await fetch(`/api/orders/${order.id}`).then(r => r.json())
        if (updated?.id) setOrder(updated)
      }
    } finally { setCancelling(false) }
  }

  async function handleRefresh() {
    if (!order) return
    const updated = await fetch(`/api/orders/${order.id}`).then(r => r.json())
    if (updated?.id) setOrder(updated)
  }

  const isUsdt = order?.paymentMethod === 'usdt'
  const isOkpay = order?.paymentMethod === 'okpay'
  const payLabel = isUsdt ? 'USDT' : isOkpay ? 'OKPay' : '余额'

  const firstItem = order?.items[0]
  const thumb = (() => {
    try { return firstItem?.product?.images ? (JSON.parse(firstItem.product.images) as string[])[0] : null }
    catch { return null }
  })()

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100dvh' }}>
      <AppHeader title="订单详情" showBack />

      <div style={{
        padding: `calc(80px + env(safe-area-inset-top) + 16px) 20px calc(76px + env(safe-area-inset-bottom) + 16px)`,
      }}>
        {loading ? (
          <>
            <div className="skeleton" style={{ height: 200, borderRadius: 24, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 140, borderRadius: 24, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 160, borderRadius: 24 }} />
          </>
        ) : !order ? (
          <div style={{ textAlign: 'center', color: '#8A9690', paddingTop: 60, fontSize: 15 }}>订单不存在</div>
        ) : (
          <>
            {/* 订单信息卡片 */}
            <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 14px rgba(0,0,0,0.065)', padding: '20px 18px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#10201A' }}>订单状态</span>
                <StatusBadge status={order.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: '#8A9690' }}>订单号：{order.orderNo}</span>
                <CopyButton text={order.orderNo} label="复制" />
              </div>

              {/* 商品信息 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderTop: '1px solid #F2F2F2', borderBottom: '1px solid #F2F2F2', marginBottom: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', flexShrink: 0, background: '#F0FAF5', position: 'relative' }}>
                  {thumb ? (
                    <Image src={thumb} alt={firstItem?.name ?? ''} fill sizes="52px" style={{ objectFit: 'cover' }} unoptimized />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2EA66F' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#10201A', marginBottom: 4 }}>{firstItem?.name ?? '商品'}</p>
                  <p style={{ fontSize: 12, color: '#8A9690' }}>数量 ×{order.items.reduce((s, i) => s + i.quantity, 0)}</p>
                </div>
              </div>

              {/* 金额 + 支付方式 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#8A9690' }}>金额</span>
                {isUsdt || isOkpay ? (
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#3B6FE0' }}>
                    {Number(order.totalAmount).toFixed(2)} {isUsdt ? 'USDT' : 'OKPay'}
                  </span>
                ) : (
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#2EA66F' }}>¥{Number(order.totalAmount).toFixed(2)}</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#8A9690' }}>支付方式</span>
                <span style={{ fontSize: 13, color: '#10201A', fontWeight: 600 }}>{payLabel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#8A9690' }}>下单时间</span>
                <span style={{ fontSize: 13, color: '#10201A' }}>{formatDate(order.createdAt)}</span>
              </div>
            </div>

            {/* 卡密信息卡片 */}
            <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 14px rgba(0,0,0,0.065)', padding: '20px 18px', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#10201A', marginBottom: 14 }}>卡密信息</h3>
              {order.status === 'PENDING' || order.status === 'PAID' ? (
                <div style={{ padding: '14px 16px', background: '#F0FAF5', borderRadius: 14, textAlign: 'center' }}>
                  <p style={{ color: '#2EA66F', fontSize: 13, fontWeight: 600 }}>支付完成后自动发货</p>
                </div>
              ) : order.status === 'COMPLETED' && order.cardKeys && order.cardKeys.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {order.cardKeys.map((key, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: '#F8FCF9', borderRadius: 12, padding: '12px 14px',
                      border: '1px solid #D8F0E6',
                    }}>
                      <p style={{ flex: 1, fontSize: 13, color: '#10201A', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.6 }}>{key}</p>
                      <CopyButton text={key} />
                    </div>
                  ))}
                  <button
                    onClick={() => order.cardKeys && navigator.clipboard.writeText(order.cardKeys.join('\n'))}
                    className="btn-primary"
                    style={{ width: '100%', marginTop: 6 }}
                  >
                    复制全部卡密
                  </button>
                </div>
              ) : order.status === 'COMPLETED' ? (
                <div style={{ padding: '14px 16px', background: '#F0FAF5', borderRadius: 14, textAlign: 'center' }}>
                  <p style={{ color: '#2EA66F', fontSize: 13 }}>库存已发放完毕</p>
                </div>
              ) : (
                <div style={{ padding: '14px 16px', background: '#F2F2F4', borderRadius: 14, textAlign: 'center' }}>
                  <p style={{ color: '#8A9690', fontSize: 13 }}>订单已取消，无法查看卡密信息</p>
                </div>
              )}
            </div>

            {/* 底部操作栏 */}
            {(order.status === 'PENDING' || order.status === 'COMPLETED') && (
              <div style={{ display: 'flex', gap: 12 }}>
                {order.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      style={{
                        flex: 1, padding: '14px', borderRadius: 999, fontSize: 15, fontWeight: 700,
                        background: '#fff', border: '1.5px solid #DEDEDE', color: '#6B7C73', cursor: 'pointer',
                      }}
                    >{cancelling ? '取消中...' : '取消订单'}</button>
                    <button
                      onClick={handleRefresh}
                      style={{
                        flex: 1, padding: '14px', borderRadius: 999, fontSize: 15, fontWeight: 700,
                        background: '#2EA66F', border: 'none', color: '#fff', cursor: 'pointer',
                      }}
                    >刷新支付状态</button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => order.cardKeys && navigator.clipboard.writeText(order.cardKeys.join('\n'))}
                      style={{
                        flex: 1, padding: '14px', borderRadius: 999, fontSize: 15, fontWeight: 700,
                        background: '#fff', border: '1.5px solid #2EA66F', color: '#2EA66F', cursor: 'pointer',
                      }}
                    >复制卡密</button>
                    <button style={{
                      flex: 1, padding: '14px', borderRadius: 999, fontSize: 15, fontWeight: 700,
                      background: '#2EA66F', border: 'none', color: '#fff', cursor: 'pointer',
                    }}>联系客服</button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
