'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useBackButton } from '../../../hooks/use-back-button'
import { apiFetch } from '../../../lib/api-fetch'

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  PENDING:    { label: '待支付', bg: '#FFF4E5', color: '#F59E0B', icon: '⏳' },
  PAID:       { label: '已支付', bg: '#EEF3FF', color: '#4F74E8', icon: '✅' },
  PROCESSING: { label: '处理中', bg: '#EEF3FF', color: '#4F74E8', icon: '⚙️' },
  COMPLETED:  { label: '已完成', bg: '#E8F7EE', color: '#2EA66F', icon: '✅' },
  CANCELLED:  { label: '已取消', bg: '#F5F5F5', color: '#8A9690', icon: '❌' },
}

const PAYMENT_LABEL: Record<string, string> = {
  BALANCE: '余额支付', EPUSDT: 'USDT', OKPAY: 'OKPAY',
}

interface OrderItem {
  name: string; productName?: string; specName?: string | null
  quantity: number; price: string | number; cardKeys?: string[]
}
interface OrderDetail {
  id: number; status: string; payStatus?: string; paymentMethod?: string | null
  createdAt: string; updatedAt?: string
  totalAmount?: string | number
  expiresAt?: string | null; cancelReason?: string | null
  items?: OrderItem[]
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    function calc() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setLabel('已超时'); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setLabel(`${m}: ${String(s).padStart(2, '0')} 后将超时自动取消`)
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [expiresAt])
  return (
    <div style={{
      background: '#FFF4E5', borderRadius: 10, padding: '8px 12px',
      fontSize: 13, color: '#F59E0B', fontWeight: 600, textAlign: 'center',
      marginTop: 8,
    }}>⏱ {label}</div>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={async () => {
      try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }
      catch { /* ignore */ }
    }} style={{
      padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
      background: copied ? '#E8F7EE' : '#F3F4F6',
      color: copied ? '#32B579' : '#6B7C73',
      border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
    }}>
      {copied ? '已复制 ✓' : '复制'}
    </button>
  )
}

export default function OrderDetailPage() {
  useBackButton()
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(async () => {
    if (!params.id) return
    try {
      const data = await apiFetch<OrderDetail>(`/api/orders/${params.id}`)
      setOrder(data)
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [params.id])

  useEffect(() => { load() }, [load])

  async function handleCancel() {
    if (!order || cancelling) return
    setCancelling(true)
    try {
      await apiFetch(`/api/orders/${order.id}/cancel`, { method: 'POST' })
      await load()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '取消失败'
      alert(msg)
    } finally { setCancelling(false) }
  }

  if (loading) return (
    <div className="tg-content-top" style={{ padding: 16, background: '#F6F6F8', minHeight: '100dvh' }}>
      <div className="skeleton" style={{ height: 80, borderRadius: 20, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 120, borderRadius: 20, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 160, borderRadius: 20 }} />
    </div>
  )

  if (!order) return (
    <div className="tg-content-top" style={{ padding: '40px 20px', textAlign: 'center', color: '#8A9690', background: '#F6F6F8', minHeight: '100dvh' }}>
      订单不存在
    </div>
  )

  const statusInfo = STATUS_MAP[order.status] ?? { label: order.status, bg: '#F5F5F5', color: '#8A9690', icon: '•' }
  const amount = Number(order.totalAmount ?? 0)
  const isPending = order.status === 'PENDING'
  const isCancelled = order.status === 'CANCELLED'
  const allKeys = order.items?.flatMap(it => it.cardKeys ?? []) ?? []

  function getCancelLabel(reason?: string | null) {
    if (reason === 'TIMEOUT') return '超时自动取消'
    if (reason === 'USER_CANCELLED') return '用户取消'
    return '订单已取消'
  }

  return (
    <div className="tg-content-top" style={{
      background: '#F6F6F8', minHeight: '100dvh',
      paddingBottom: isPending ? 'calc(90px + max(0px, env(safe-area-inset-bottom, 0px)))' : 'calc(24px + max(0px, env(safe-area-inset-bottom, 0px)))',
    }}>
      <div style={{ padding: '16px 16px 8px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#10201A', margin: 0 }}>订单详情</h2>
      </div>

      {/* 状态卡 */}
      <div style={{ margin: '0 12px 12px' }}>
        <div style={{
          background: statusInfo.bg, borderRadius: 20, padding: 18,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 32 }}>{statusInfo.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: statusInfo.color }}>
              {isCancelled ? getCancelLabel(order.cancelReason) : statusInfo.label}
            </div>
            <div style={{ fontSize: 12, color: '#8A9690', marginTop: 2 }}>订单 #{order.id}</div>
            {order.paymentMethod && (
              <div style={{ fontSize: 12, color: '#8A9690', marginTop: 1 }}>
                支付方式：{PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: statusInfo.color }}>
              ¥{amount.toFixed(2)}
            </div>
          </div>
        </div>
        {isPending && order.expiresAt && (
          <ExpiryCountdown expiresAt={order.expiresAt} />
        )}
      </div>

      {/* 商品明细 */}
      {order.items?.map((item, idx) => {
        const displayName = item.productName || item.name || ''
        const keys = item.cardKeys ?? []
        return (
          <div key={idx} style={{ margin: '0 12px 12px' }}>
            <div style={{ background: 'white', borderRadius: 20, padding: 16, boxShadow: '0 1px 6px rgba(16,32,26,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#10201A' }}>{displayName}</span>
                  {item.specName && (
                    <span style={{ fontSize: 12, color: '#32B579', marginLeft: 6 }}>· {item.specName}</span>
                  )}
                </div>
                <span style={{ fontWeight: 700, color: '#32B579', whiteSpace: 'nowrap', marginLeft: 8 }}>
                  ¥{Number(item.price).toFixed(2)} × {item.quantity}
                </span>
              </div>
              {keys.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: '#8A9690', marginBottom: 8 }}>卡密</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {keys.map((key, ki) => (
                      <div key={ki} style={{
                        background: '#F6F6F8', borderRadius: 10, padding: '10px 12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      }}>
                        <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#10201A', flex: 1, wordBreak: 'break-all' }}>{key}</span>
                        <CopyBtn text={key} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* 时间信息 */}
      <div style={{ margin: '0 12px 12px' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '14px 16px', boxShadow: '0 1px 6px rgba(16,32,26,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#8A9690' }}>创建时间</span>
            <span style={{ fontSize: 13, color: '#10201A' }}>{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
          </div>
          {order.expiresAt && isPending && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#8A9690' }}>支付截止</span>
              <span style={{ fontSize: 13, color: '#F59E0B' }}>{new Date(order.expiresAt).toLocaleString('zh-CN')}</span>
            </div>
          )}
          {order.updatedAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#8A9690' }}>更新时间</span>
              <span style={{ fontSize: 13, color: '#10201A' }}>{new Date(order.updatedAt).toLocaleString('zh-CN')}</span>
            </div>
          )}
        </div>
      </div>

      {/* 待支付 取消按钒 */}
      {isPending && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'white', borderTop: '1px solid #ECEEF0',
          padding: '12px 16px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          zIndex: 90,
          display: 'flex', gap: 12,
        }}>
          <button onClick={() => router.back()}
            style={{
              flex: 1, padding: 14, borderRadius: 999, border: '1.5px solid #E0E0E0',
              background: 'transparent', fontSize: 14, color: '#6B7C73', cursor: 'pointer', fontWeight: 600,
            }}>返回</button>
          <button onClick={handleCancel} disabled={cancelling}
            style={{
              flex: 1, padding: 14, borderRadius: 999, border: 'none',
              background: cancelling ? '#F5F5F5' : '#FFF0F0',
              fontSize: 14, color: cancelling ? '#8A9690' : '#E53935',
              cursor: cancelling ? 'not-allowed' : 'pointer', fontWeight: 700,
            }}>
            {cancelling ? '取消中...' : '取消订单'}
          </button>
        </div>
      )}

      {allKeys.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'white', borderTop: '1px solid #ECEEF0',
          padding: '12px 16px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          zIndex: 90,
        }}>
          <button onClick={() => { navigator.clipboard.writeText(allKeys.join('\n')).catch(() => { /* ignore */ }) }}
            style={{
              width: '100%', padding: 14, borderRadius: 999, border: 'none',
              background: '#32B579', color: 'white', fontWeight: 700, fontSize: 16, cursor: 'pointer',
            }}>一键复制所有卡密</button>
        </div>
      )}
    </div>
  )
}
