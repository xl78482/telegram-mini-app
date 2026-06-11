'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { AppHeader } from '@/components/AppHeader'
import { PaymentMethodTabs } from '@/components/PaymentMethodTabs'

interface Product {
  id: number; name: string; price: string; images?: string | null
  stock: number; description?: string | null; soldCount?: number
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [payMethod, setPayMethod] = useState('balance')
  const [showConfirm, setShowConfirm] = useState(false)
  const [buying, setBuying] = useState(false)
  const [userBalance, setUserBalance] = useState('0.00')
  const [toast, setToast] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${params.id}`).then(r => r.json()).catch(() => null),
      fetch('/api/user').then(r => r.json()).catch(() => null),
    ]).then(([prod, user]) => {
      if (prod?.id) setProduct(prod)
      if (user?.balance) setUserBalance(user.balance)
    }).finally(() => setLoading(false))
  }, [params.id])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleBuy() {
    if (!product || buying) return
    if (payMethod === 'balance') {
      const bal = Number(userBalance)
      const need = Number(product.price) * qty
      if (bal < need) { showToast('余额不足，请充値余额！'); return }
      setShowConfirm(true)
      return
    }
    await submitOrder()
  }

  async function submitOrder() {
    if (!product || buying) return
    setBuying(true)
    setShowConfirm(false)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: qty, paymentMethod: payMethod }),
      })
      const data = await res.json()
      if (res.ok && data?.id) {
        window.location.href = `/orders/${data.id}`
      } else {
        showToast(data?.error || '下单失败，请重试')
      }
    } catch { showToast('网络错误，请重试') }
    finally { setBuying(false) }
  }

  const images = product?.images ? (() => { try { return JSON.parse(product.images!) as string[] } catch { return [] } })() : []
  const thumb = images[0] ?? null
  const isSoldOut = product ? product.stock === 0 : false

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100dvh' }}>
      <AppHeader title="商品详情" showBack />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 'calc(90px + env(safe-area-inset-top))',
          left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(16,32,26,0.88)', color: '#fff',
          padding: '10px 20px', borderRadius: 999,
          fontSize: 13, fontWeight: 600, zIndex: 300,
          whiteSpace: 'nowrap', maxWidth: 280, textAlign: 'center',
        }}>{toast}</div>
      )}

      <div style={{
        padding: `calc(80px + env(safe-area-inset-top) + 16px) 20px calc(90px + env(safe-area-inset-bottom))`,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {loading ? (
          <>
            <div className="skeleton" style={{ height: 220, borderRadius: 24 }} />
            <div className="skeleton" style={{ height: 120, borderRadius: 24 }} />
            <div className="skeleton" style={{ height: 100, borderRadius: 24 }} />
          </>
        ) : !product ? (
          <div style={{ textAlign: 'center', color: '#8A9690', paddingTop: 60, fontSize: 15 }}>商品不存在</div>
        ) : (
          <>
            {/* 商品大图 */}
            <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 14px rgba(0,0,0,0.065)', overflow: 'hidden' }}>
              <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', background: '#F0FAF5' }}>
                {thumb ? (
                  <Image src={thumb} alt={product.name} fill style={{ objectFit: 'cover' }} unoptimized />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B0D8C4' }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                  </div>
                )}
              </div>
              <div style={{ padding: '16px 18px' }}>
                <h1 style={{ fontSize: 19, fontWeight: 800, color: '#10201A', marginBottom: 4 }}>{product.name}</h1>
              </div>
            </div>

            {/* 价格库存卡片 */}
            <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 14px rgba(0,0,0,0.065)', padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 12, color: '#8A9690', marginBottom: 4 }}>售价</p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: '#2EA66F' }}>¥{Number(product.price).toFixed(2)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, color: '#8A9690', marginBottom: 4 }}>库存</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: isSoldOut ? '#F85050' : '#10201A' }}>
                    {isSoldOut ? '已售罄' : `${product.stock} 件`}
                  </p>
                  {product.soldCount !== undefined && (
                    <p style={{ fontSize: 11, color: '#8A9690', marginTop: 2 }}>已售 {product.soldCount}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 购买数量 */}
            <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 14px rgba(0,0,0,0.065)', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#10201A' }}>购买数量</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{
                      width: 36, height: 36, borderRadius: 999,
                      background: qty <= 1 ? '#F2F2F4' : '#E8F7F0',
                      color: qty <= 1 ? '#C0C0C0' : '#2EA66F',
                      border: 'none', cursor: qty <= 1 ? 'default' : 'pointer',
                      fontSize: 20, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >−</button>
                  <span style={{ width: 44, textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#10201A' }}>{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    disabled={qty >= product.stock}
                    style={{
                      width: 36, height: 36, borderRadius: 999,
                      background: qty >= product.stock ? '#F2F2F4' : '#E8F7F0',
                      color: qty >= product.stock ? '#C0C0C0' : '#2EA66F',
                      border: 'none', cursor: qty >= product.stock ? 'default' : 'pointer',
                      fontSize: 20, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >+</button>
                </div>
              </div>
            </div>

            {/* 服务保障 */}
            <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 14px rgba(0,0,0,0.065)', padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                {['自动发货', '正品保障', '售后无忧'].map(tag => (
                  <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#2EA66F' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 商品说明 */}
            {product.description && (
              <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 14px rgba(0,0,0,0.065)', padding: '16px 18px' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#10201A', marginBottom: 12 }}>商品说明</h3>
                <p style={{ fontSize: 14, color: '#6B7C73', lineHeight: 1.75 }}>{product.description}</p>
              </div>
            )}

            {/* 支付方式 */}
            <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 14px rgba(0,0,0,0.065)', padding: '16px 18px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#10201A', marginBottom: 14 }}>支付方式</h3>
              <PaymentMethodTabs value={payMethod} onChange={setPayMethod} />
            </div>
          </>
        )}
      </div>

      {/* 底部固定购买栏 */}
      {product && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          padding: `14px 20px calc(14px + env(safe-area-inset-bottom))`,
          zIndex: 50,
          maxWidth: '28rem', margin: '0 auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 13, color: '#8A9690' }}>已选 <b style={{ color: '#10201A' }}>{qty}</b> 件</span>
            <button
              className="btn-primary"
              onClick={handleBuy}
              disabled={isSoldOut || buying}
              style={{ flex: 1, height: 50, fontSize: 16 }}
            >
              {buying ? '下单中...' : isSoldOut ? '已售罄' : '立即购买'}
            </button>
          </div>
        </div>
      )}

      {/* 余额支付弹窗 */}
      {showConfirm && product && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#10201A', marginBottom: 10, textAlign: 'center' }}>确认支付</h3>
            <p style={{ fontSize: 14, color: '#6B7C73', textAlign: 'center', marginBottom: 24, lineHeight: 1.7 }}>
              是否使用余额支付？<br/>
              当前余额 <b style={{ color: '#2EA66F' }}>¥{Number(userBalance).toFixed(2)}</b><br/>
              本次支付 <b style={{ color: '#2EA66F' }}>¥{(Number(product.price) * qty).toFixed(2)}</b>
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: '14px', borderRadius: 999,
                  background: '#F2F2F4', color: '#6B7C73',
                  border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >取消支付</button>
              <button
                onClick={submitOrder}
                className="btn-primary"
                style={{ flex: 1, height: 50 }}
              >确定支付</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
