'use client'

const methods = [
  { key: 'balance', label: '余额支付' },
  { key: 'usdt', label: 'USDT 支付' },
  { key: 'okpay', label: 'OKPay' },
]

interface PaymentMethodTabsProps {
  value: string
  onChange: (v: string) => void
}

export function PaymentMethodTabs({ value, onChange }: PaymentMethodTabsProps) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {methods.map(m => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600,
            border: value === m.key ? '2px solid #2EA66F' : '2px solid #EBEBEB',
            background: value === m.key ? '#E8F7F0' : '#fff',
            color: value === m.key ? '#2EA66F' : '#6B7C73',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
