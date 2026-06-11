'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useBackButton } from '../../../hooks/use-back-button'
import { apiFetch } from '../../../lib/api-fetch'

interface Spec {
  id: number
  productId: number
  name: string
  price: string
  stock: number
  sortOrder: number
  isActive: boolean
}

interface Product {
  id: number
  name: string
  description?: string | null
  price: string | number
  stock: number
  images?: string
  isActive: boolean
  category?: string | null
  specs: Spec[]
}

interface CreateOrderResponse {
  id?: number
  orderId?: number
  error?: string
}

const PAY_METHODS = [
  { key: 'BALANCE', label: '余额支付' },
  { key: 'EPUSDT', label: 'USDT 支付' },
  { key: 'OKPAY', label: 'OKPAY' },
]

export default function ProductDetailPage() {
  useBackButton()
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSpec, setSelectedSpec] = useState<Spec | null>(null)
  const [payMethod, setPayMethod] = useState<string>('BALANCE')
  const [qty, setQty] = useState(1)
  const [showPayModal, setShowPayModal] = useState(false)
  const [payModalVisible, setPayModalVisible] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payResult, setPayResult] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(r => r.json())
      .then((data: Product) => {
        setProduct(data)
        // 默认选中第一个有库存的规格
        if (data.specs?.length > 0) {
          const first = data.specs.find(s => s.stock > 0) ?? null
          setSelectedSpec(first)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  const hasSpecs = (product?.specs?.length ?? 0) > 0
  const maxQty = hasSpecs
    ? (selectedSpec?.stock ?? 0)
    : (product?.stock ?? 0)

  const currentPrice = hasSpecs
    ? (selectedSpec ? Number(selectedSpec.price) : 0)
    : Number(product?.price ?? 0)

  const canBuy = hasSpecs
    ? (selectedSpec !== null && (selectedSpec?.stock ?? 0) > 0)
    : ((product?.stock ?? 0) > 0)

  const openPayModal = () => {
    setShowPayModal(true)
    setTimeout(() => setPayModalVisible(true), 10)
  }
  const closePayModal = () => {
    setPayModalVisible(false)
    setTimeout(() => setShowPayModal(false), 300)
  }

  const handleBuy = async () => {
    if (paying || !product) return
    if (hasSpecs && !selectedSpec) { setPayResult('请选择规格'); return }
    setPaying(true)
    setPayResult(null)
    try {
      const data = await apiFetch<CreateOrderResponse>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: [{
            productId: product.id,
            specId: selectedSpec?.id ?? null,
            quantity: qty,
          }],
          paymentMethod: payMethod,
        }),
      })
      const orderId = data.id ?? data.orderId
      closePayModal()
      if (orderId) router.push(`/orders/${orderId}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '未知错误'
      setPayResult('购买失败: ' + msg)
    } finally {
      setPaying(false)
    }
  }

  const parseImages = (raw?: string): string[] => {
    if (!raw) return []
    try { return JSON.parse(raw) as string[] } catch { return [] }
  }

  if (loading) return (
    <div className="tg-page tg-content-top" style={{ padding: '24px 16px' }}>
      <div className="skeleton" style={{ height: 220, borderRadius: 24, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 16, width: '80%' }} />
    </div>
  )

  if (!product) return (
    <div className="tg-page tg-content-top" style={{ padding: '40px 20px', textAlign: 'center', color: '#8A9690' }}>
      商品不存在
    </div>
  )

  const images = parseImages(product.images)

  return (
    <div className="tg-page tg-content-top" style={{
      background: '#F6F6F8',
      paddingBottom: 'calc(100px + max(0px, env(safe-area-inset-bottom, 0px)))',
    }}>
      {/* 商品图片 */}
      {images.length > 0 ? (
        <img src={images[0]} alt={product.name}
          style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{
          width: '100%', height: 200,
          background: 'linear-gradient(135deg, #e0f7ea 0%, #c8f0d8 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 56,
        }}>🎁</div>
      )}

      <div style={{ padding: '16px 16px 0' }}>
        {product.category && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#32B579',
            background: '#E8F7EE', borderRadius: 6, padding: '2px 8px',
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>{product.category}</span>
        )}
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#10201A', margin: '8px 0 6px' }}>
          {product.name}
        </h1>
        {product.description && (
          <p style={{ fontSize: 14, color: '#8A9690', lineHeight: 1.6, margin: 0 }}>
            {product.description}
          </p>
        )}
      </div>

      {/* 规格选择区 */}
      {hasSpecs && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#10201A', marginBottom: 10 }}>选择规格</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {product.specs.map(s => {
              const isSelected = selectedSpec?.id === s.id
              const outOfStock = s.stock === 0
              return (
                <button
                  key={s.id}
                  disabled={outOfStock}
                  onClick={() => { if (!outOfStock) { setSelectedSpec(s); setQty(1) } }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    border: isSelected ? '2px solid #32B579' : '1.5px solid #E0E0E0',
                    background: outOfStock ? '#F5F5F5' : isSelected ? '#E8F7EE' : 'white',
                    cursor: outOfStock ? 'not-allowed' : 'pointer',
                    opacity: outOfStock ? 0.5 : 1,
                    transition: 'all 0.15s',
                    textAlign: 'left' as const,
                    minWidth: 80,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: outOfStock ? '#8A9690' : '#10201A' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: 12, color: isSelected ? '#32B579' : '#8A9690', marginTop: 2 }}>
                    ¥{Number(s.price).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: outOfStock ? '#D0D0D0' : '#8A9690', marginTop: 1 }}>
                    {outOfStock ? '库存不足' : `剩 ${s.stock} 份`}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 价格区 */}
      <div style={{ padding: '16px' }}>
        <div style={{
          background: 'white', borderRadius: 18,
          padding: '14px 16px',
          boxShadow: '0 1px 8px rgba(16,32,26,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#8A9690' }}>
              {hasSpecs ? '规格价格' : '商品价格'}
            </span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#32B579' }}>
              ¥{currentPrice.toFixed(2)}
            </span>
          </div>
          {!hasSpecs && (
            <div style={{ fontSize: 12, color: '#8A9690', marginTop: 4 }}>
              库存: {product.stock} 份
            </div>
          )}
        </div>
      </div>

      {/* 购买按钮 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', borderTop: '1px solid #ECEEF0',
        padding: '12px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        zIndex: 90,
      }}>
        <button
          onClick={openPayModal}
          disabled={!canBuy}
          style={{
            width: '100%', padding: '14px', borderRadius: 999, border: 'none',
            background: canBuy ? '#32B579' : '#E0E0E0',
            color: canBuy ? 'white' : '#8A9690',
            fontWeight: 700, fontSize: 16, cursor: canBuy ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          {!canBuy ? '库存不足' : (
            hasSpecs && !selectedSpec ? '请选择规格' : `立即购买 ¥${(currentPrice * qty).toFixed(2)}`
          )}
        </button>
      </div>

      {/* 支付弹层 */}
      {showPayModal && (
        <div
          onClick={closePayModal}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 100, display: 'flex', alignItems: 'flex-end',
            opacity: payModalVisible ? 1 : 0, transition: 'opacity 0.25s',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', background: 'white',
              borderRadius: '24px 24px 0 0',
              padding: '24px 20px',
              paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
              transform: payModalVisible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s cubic-bezier(0.32,0,0,1)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#10201A' }}>确认购买</div>
              <div style={{ fontSize: 13, color: '#8A9690', marginTop: 4 }}>
                {product.name}
                {selectedSpec ? ` · ${selectedSpec.name}` : ''}
              </div>
            </div>

            {/* 数量选择 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 14, color: '#10201A', fontWeight: 600 }}>购买数量</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#F3F4F6', border: 'none',
                    fontSize: 18, cursor: 'pointer', color: '#10201A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>-</button>
                <span style={{ fontSize: 16, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#F3F4F6', border: 'none',
                    fontSize: 18, cursor: 'pointer', color: '#10201A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>+</button>
              </div>
            </div>

            {/* 支付方式选择 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: '#10201A', fontWeight: 600, marginBottom: 10 }}>支付方式</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {PAY_METHODS.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setPayMethod(m.key)}
                    style={{
                      flex: 1, padding: '8px 4px',
                      borderRadius: 12,
                      border: payMethod === m.key ? '2px solid #32B579' : '1.5px solid #E0E0E0',
                      background: payMethod === m.key ? '#E8F7EE' : 'white',
                      fontSize: 12, fontWeight: 700,
                      color: payMethod === m.key ? '#32B579' : '#6B7C73',
                      cursor: 'pointer',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 总价 */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 20,
              padding: '12px 16px',
              background: '#F6F6F8', borderRadius: 12,
            }}>
              <span style={{ fontSize: 14, color: '#8A9690' }}>合计</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#32B579' }}>
                ¥{(currentPrice * qty).toFixed(2)}
              </span>
            </div>

            {payResult && (
              <div style={{
                marginBottom: 12, padding: '10px 14px',
                background: '#FFF0F0', borderRadius: 10,
                fontSize: 13, color: '#E53935',
              }}>{payResult}</div>
            )}

            <button
              onClick={handleBuy}
              disabled={paying}
              style={{
                width: '100%', padding: '14px', borderRadius: 999, border: 'none',
                background: paying ? '#A0D9BE' : '#32B579',
                color: 'white', fontWeight: 700, fontSize: 16,
                cursor: paying ? 'not-allowed' : 'pointer',
              }}
            >
              {paying ? '提交中...' : '确认购买'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
