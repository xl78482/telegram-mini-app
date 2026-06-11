'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Shield, Zap, Star } from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { PaymentMethodTabs } from '@/components/PaymentMethodTabs'
import { useInitData } from '@/hooks/use-init-data'

interface Product {
  id: number; name: string; price: string; description?: string | null
  images?: string | null; stock: number
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const initData = useInitData()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [payMethod, setPayMethod] = useState('balance')
  const [imgIdx, setImgIdx] = useState(0)
  const [buying, setBuying] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [balanceError, setBalanceError] = useState('')
  const [user, setUser] = useState<{ balance: string } | null>(null)

  useEffect(() => {
    fetch(`/api/products/${id}`).then(r => r.json()).then(setProduct).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (initData) {
      fetch('/api/user', { headers: { 'x-init-data': initData } })
        .then(r => r.json()).then(data => { if (data.id) setUser(data) })
    }
  }, [initData])

  const images = product?.images ? JSON.parse(product.images) as string[] : []

  async function handleBuy() {
    if (!initData || !product) return
    setBuying(true)
    setBalanceError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
        body: JSON.stringify({ items: [{ productId: product.id, quantity: qty }] }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error?.includes('余额')) setBalanceError('余额不足，请充值余额！')
        else alert(data.error)
        return
      }
      router.push(`/orders/${data.id}`)
    } finally {
      setBuying(false)
      setShowConfirm(false)
    }
  }

  if (loading) return (
    <div style={{ background: '#F6F6F8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #2EA66F', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!product) return (
    <div style={{ background: '#F6F6F8', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8A9690' }}>
      <p style={{ fontSize: 16, marginBottom: 16 }}>商品不存在</p>
      <button onClick={() => router.back()} style={{ color: '#2EA66F', background: 'none', border: 'none', fontSize: 15, cursor: 'pointer' }}>返回</button>
    </div>
  )

  const totalPrice = (Number(product.price) * qty).toFixed(2)

  return (
    <div style={{ background: '#F6F6F8', minHeight: '100vh', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
      <AppHeader title="商品详情" subtitle="" showBack />

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* 商品图片 */}
        <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ position: 'relative', aspectRatio: '1', width: '100%', background: '#F0FAF5' }}>
            {images.length > 0 ? (
              <Image src={images[imgIdx]} alt={product.name} fill style={{ objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>📦</div>
            )}
            {images.length > 1 && (
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} style={{
                    width: i === imgIdx ? 16 : 6, height: 6, borderRadius: 999,
                    background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)',
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0,
                  }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 商品名称 + 价格库存 */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '18px 18px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#10201A', marginBottom: 14 }}>{product.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 12, color: '#8A9690' }}>售价：</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#2EA66F' }}>¥{Number(product.price).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#6B7C73' }}>
              <span>库存 {product.stock} 件</span>
            </div>
          </div>
        </div>

        {/* 购买数量 */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '16px 18px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#10201A' }}>购买数量</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))
              }
              style={{
                width: 32, height: 32, borderRadius: 999, border: '1.5px solid #EBEBEB',
                background: qty <= 1 ? '#F6F6F8' : '#fff', fontSize: 18, fontWeight: 600,
                color: qty <= 1 ? '#C8D4CC' : '#2EA66F', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>−</button>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#10201A', minWidth: 24, textAlign: 'center' }}>{qty}</span>
            <button
              onClick={() => setQty(q => Math.min(product.stock, q + 1))}
              style={{
                width: 32, height: 32, borderRadius: 999, border: 'none',
                background: '#2EA66F', fontSize: 18, fontWeight: 600,
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>+</button>
          </div>
        </div>

        {/* 服务保障 */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '16px 18px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {[{ icon: <Zap size={16} />, text: '自动发货' }, { icon: <Shield size={16} />, text: '正品保障' }, { icon: <Star size={16} />, text: '售后无忧' }].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2EA66F', fontSize: 13, fontWeight: 600 }}>
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 商品说明 */}
        {product.description && (
          <div style={{ background: '#fff', borderRadius: 24, padding: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#10201A', marginBottom: 10 }}>商品说明</p>
            <p style={{ fontSize: 14, color: '#6B7C73', lineHeight: 1.7 }}>{product.description}</p>
          </div>
        )}

        {/* 支付方式 */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#10201A', marginBottom: 12 }}>支付方式</p>
          <PaymentMethodTabs value={payMethod} onChange={setPayMethod} />
        </div>

        {balanceError && (
          <div style={{
            background: '#FFF3E8', borderRadius: 14, padding: '12px 16px',
            fontSize: 14, color: '#E07B2A', fontWeight: 600, textAlign: 'center',
          }}>{balanceError}</div>
        )}
      </div>

      {/* 底部购买栏 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '1px solid rgba(0,0,0,0.05)',
        padding: '12px 20px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 448, margin: '0 auto', zIndex: 40,
      }}>
        <div>
          <p style={{ fontSize: 12, color: '#8A9690' }}>已选 {qty} 件</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#2EA66F' }}>¥{totalPrice}</p>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={product.stock === 0 || buying}
          style={{
            background: product.stock === 0 ? '#C8D4CC' : '#2EA66F',
            color: '#fff', border: 'none', borderRadius: 999,
            padding: '14px 36px', fontSize: 16, fontWeight: 700,
            cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {buying ? '处理中...' : product.stock === 0 ? '已售罄' : '立即购买'}
        </button>
      </div>

      {/* 确认支付弹窗 */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)',
        }} onClick={() => setShowConfirm(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '24px 24px 0 0',
              padding: '24px 24px 32px', width: '100%', maxWidth: 448,
            }}
          >
            <p style={{ fontSize: 18, fontWeight: 800, color: '#10201A', textAlign: 'center', marginBottom: 12 }}>确认支付</p>
            <p style={{ fontSize: 14, color: '#6B7C73', textAlign: 'center', marginBottom: 8 }}>
              是否使用余额支付？当前余额 ¥{user ? Number(user.balance).toFixed(2) : '--'}
            </p>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#2EA66F', textAlign: 'center', marginBottom: 24 }}>¥{totalPrice}</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: 14, borderRadius: 999, fontSize: 15, fontWeight: 600,
                  border: '1.5px solid #EBEBEB', background: '#fff', color: '#6B7C73', cursor: 'pointer',
                }}
              >取消支付</button>
              <button
                onClick={handleBuy}
                disabled={buying}
                style={{
                  flex: 1, padding: 14, borderRadius: 999, fontSize: 15, fontWeight: 700,
                  border: 'none', background: '#2EA66F', color: '#fff', cursor: 'pointer',
                }}
              >{buying ? '处理中...' : '确定支付'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
