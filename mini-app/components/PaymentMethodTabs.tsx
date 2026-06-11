'use client'

const METHODS = [
  { key: 'balance', label: '余额支付' },
  { key: 'usdt',    label: 'USDT 支付' },
  { key: 'okpay',   label: 'OKPay' },
]

export function PaymentMethodTabs({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {METHODS.map(m => {
        const active = value === m.key
        return (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            style={{
              flex: 1,
              padding: '10px 6px',
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: active ? '1.5px solid #2EA66F' : '1.5px solid #EBEBEB',
              background: active ? '#F0FAF5' : '#fff',
              color: active ? '#2EA66F' : '#6B7C73',
              transition: 'all 0.15s',
            }}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
