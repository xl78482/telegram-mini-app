'use client'

const METHODS = [
  {
    key: 'balance',
    label: '余额支付',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
      </svg>
    ),
  },
  {
    key: 'usdt',
    label: 'USDT',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H9m0 0h4.5a1.5 1.5 0 010 3H9"/>
      </svg>
    ),
  },
  {
    key: 'okpay',
    label: 'OKPay',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 4H3a2 2 0 00-2 2v13a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z"/>
        <path d="M1 10h22"/>
      </svg>
    ),
  },
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
              padding: '14px 6px 12px',
              borderRadius: 16,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border: active ? '2px solid #2EA66F' : '1.5px solid #EAEAEA',
              background: active ? '#F0FAF5' : '#FAFAFA',
              color: active ? '#2EA66F' : '#6B7C73',
              transition: 'all 0.15s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}
