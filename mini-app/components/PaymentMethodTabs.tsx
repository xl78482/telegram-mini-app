'use client';

type PaymentMethod = 'BALANCE' | 'USDT' | 'OKPAY';

interface PaymentMethodTabsProps {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void;
  balance?: number;
}

const methods: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'BALANCE', label: '余额支付', icon: '💰' },
  { key: 'USDT', label: 'USDT', icon: '🪙' },
  { key: 'OKPAY', label: 'OKPay', icon: '💳' },
];

export default function PaymentMethodTabs({ value, onChange, balance }: PaymentMethodTabsProps) {
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
        }}
      >
        {methods.map(m => {
          const active = value === m.key;
          return (
            <button
              key={m.key}
              onClick={() => onChange(m.key)}
              style={{
                padding: '12px 8px',
                borderRadius: 16,
                border: active ? '2px solid #32B579' : '2px solid #ECEEF0',
                background: active ? '#E8F7EE' : 'white',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#32B579' : '#6B7C73',
                }}
              >
                {m.label}
              </div>
              {m.key === 'BALANCE' && balance !== undefined && (
                <div style={{ fontSize: 11, color: '#8A9690', marginTop: 2 }}>¥{balance.toFixed(2)}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
