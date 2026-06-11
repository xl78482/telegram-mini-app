'use client'

const METHODS = [
  { key: 'balance', label: '余额支付',  icon: '💰' },
  { key: 'usdt',    label: 'USDT',      icon: '💎' },
  { key: 'okpay',   label: 'OKPay',     icon: '🔗' },
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
              padding: '11px 6px',
              borderRadius: 16,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: active ? '2px solid #2EA66F' : '1.5px solid #EBEBEB',
              background: active ? '#F0FAF5' : '#fff',
              color: active ? '#2EA66F' : '#6B7C73',
              transition: 'all 0.15s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <span style={{ fontSize: 18 }}>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}
