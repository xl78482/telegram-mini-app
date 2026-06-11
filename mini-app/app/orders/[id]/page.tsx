'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/StatusBadge'
import { CopyButton } from '@/components/CopyButton'
import { AppHeader } from '@/components/AppHeader'
import { useInitData } from '@/hooks/use-init-data'
import { Copy } from 'lucide-react'

interface OrderItem { id: number; name: string; quantity: number; price: string; product: { images?: string | null } | null }
interface Order {
  id: number; orderNo: string; status: string; totalAmount: string
  remark?: string | null; createdAt: string; items: OrderItem[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const initData = useInitData()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!initData) return
    fetch(`/api/orders/${id}`, { headers: { 'x-init-data': initData } })
      .then(r => r.json()).then(setOrder).finally(() => setLoading(false))
  }, [id, initData])

  async function handleCancel() {
    if (!initData || !order) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, { method: 'POST', headers: { 'x-init-data': initData } })
      if (res.ok) {
        const updated = await fetch(`/api/orders/${id}`, { headers: { 'x-init-data': initData } }).then(r => r.json())
        setOrder(updated)
      }
    } finally { setCancelling(false) }
  }

  if (loading) return (
    <div style={{ background: '#F6F6F8', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  )

  if (!order) return (
    <div style={{ background: '#F6F6F8', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 48 }}>😔</div>
      <p style={{ color: '#8A9690', fontSize: 15 }}>订单不存在</p>
      <button onClick={() => router.back()} style={{ color: '#2EA66F', background: 'none', border: 'none', fontSize: 15, cursor: 'pointer' }}>返回</button>
    </div>
  )

  const isCompleted = order.status === 'COMPLETED'
  const isPending = order.status === 'PENDING'
  const isCancelled = order.status === 'CANCELLED'
  const cardKeys = isCompleted && order.remark ? order.remark.split('\n').filter(Boolean) : []

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100dvh', paddingBottom: 'calc(90px + env(safe-area-inset-bottom))' }}>
      <AppHeader title="订单详情" subtitle="" showBack />

      <div style={{
        padding: 'calc(80px + env(safe-area-inset-top) + 16px) 20px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>

        {/* 订单状态卡片 */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '20px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#8A9690', marginBottom: 6 }}>订单状态</p>
            <StatusBadge status={order.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, color: '#8A9690', marginBottom: 4 }}>订单编号</p>
              <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#10201A', wordBreak: 'break-all' }}>{order.orderNo}</p>
            </div>
            <CopyButton text={order.orderNo} size={14} />
          </div>
          <div style={{ borderTop: '1px solid #F0F0F0', marginTop: 14, paddingTop: 12 }}>
            <p style={{ fontSize: 12, color: '#8A9690' }}>下单时间：{formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* 商品信息卡片 */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#10201A', marginBottom: 14 }}>商品清单</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {order.items.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#10201A', marginBottom: 2 }}>{item.name}</p>
                  <p style={{ fontSize: 12, color: '#8A9690' }}>×{item.quantity}</p>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#2EA66F', marginLeft: 12 }}>
                  ¥{(Number(item.price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #F0F0F0', marginTop: 14, paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#6B7C73' }}>支付方式</span>
              <span style={{ fontSize: 13, color: '#10201A', fontWeight: 600 }}>余额</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 13, color: '#6B7C73' }}>实付金额</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#2EA66F' }}>¥{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 卡密信息卡片 */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#10201A', marginBottom: 14 }}>卡密信息</p>

          {isCancelled ? (
            <div style={{ background: '#F6F6F8', borderRadius: 14, padding: '14px 16px', textAlign: 'center', color: '#8A9690', fontSize: 13 }}>
              订单已取消，无法查看卡密信息
            </div>
          ) : isPending ? (
            <div style={{
              background: '#F0FAF5', borderRadius: 14, padding: '16px',
              textAlign: 'center', color: '#2EA66F', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <span>⏳</span>
              <span>支付完成后自动发货</span>
            </div>
          ) : isCompleted && cardKeys.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cardKeys.map((key, i) => (
                <div key={i} style={{
                  background: '#F6F6F8',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}>
                  <p style={{ fontSize: 13, fontFamily: 'monospace', color: '#10201A', flex: 1, wordBreak: 'break-all' }}>{key}</p>
                  <CopyButton text={key} size={14} />
                </div>
              ))}
              <button
                onClick={() => navigator.clipboard.writeText(cardKeys.join('\n'))}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: 999,
                  marginTop: 4,
                  background: '#E8F7F0',
                  color: '#2EA66F',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Copy size={16} />
                复制全部卡密
              </button>
            </div>
          ) : (
            <div style={{ background: '#F0FAF5', borderRadius: 14, padding: '14px', textAlign: 'center', color: '#2EA66F', fontSize: 13, fontWeight: 600 }}>
              ✅ 订单已完成
            </div>
          )}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff',
        borderTop: '1px solid rgba(0,0,0,0.05)',
        padding: '12px 20px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        display: 'flex',
        gap: 12,
        maxWidth: '28rem',
        margin: '0 auto',
        zIndex: 40,
      }}>
        {isPending ? (
          <>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 999, fontSize: 15, fontWeight: 600,
                border: '1.5px solid #EBEBEB', background: '#fff', color: '#6B7C73', cursor: 'pointer',
              }}
            >{cancelling ? '取消中...' : '取消订单'}</button>
            <button
              onClick={() => window.location.reload()}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 999, fontSize: 15, fontWeight: 700,
                border: 'none', background: '#2EA66F', color: '#fff', cursor: 'pointer',
              }}
            >刷新支付状态</button>
          </>
        ) : (
          <>
            <button
              style={{
                flex: 1, padding: '14px 0', borderRadius: 999, fontSize: 15, fontWeight: 600,
                border: '1.5px solid #2EA66F', background: '#fff', color: '#2EA66F', cursor: 'pointer',
              }}
            >联系客服</button>
            {isCompleted && (
              <button
                onClick={() => cardKeys.length > 0 && navigator.clipboard.writeText(cardKeys.join('\n'))}
                style={{
                  flex: 1, padding: '14px 0', borderRadius: 999, fontSize: 15, fontWeight: 700,
                  border: 'none', background: '#2EA66F', color: '#fff', cursor: 'pointer',
                }}
              >复制卡密</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
