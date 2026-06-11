'use client';

import { useState, useEffect } from 'react';

interface RechargeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
}

const AMOUNTS = [50, 100, 200, 500];

export default function RechargeSheet({ isOpen, onClose, currentBalance = 0 }: RechargeSheetProps) {
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [usdtRate, setUsdtRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setTimeout(() => setVisible(true), 10);
      fetchRate();
    } else {
      setVisible(false);
      setTimeout(() => setMounted(false), 320);
    }
  }, [isOpen]);

  const fetchRate = async () => {
    try {
      const res = await fetch('/api/recharge/rate');
      if (res.ok) {
        const data = await res.json();
        setUsdtRate(data.rate ?? null);
      } else {
        setUsdtRate(null);
      }
    } catch {
      setUsdtRate(null);
    }
  };

  const usdtAmount = usdtRate ? (selectedAmount / usdtRate).toFixed(4) : null;

  if (!mounted) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
          backdropFilter: visible ? 'blur(3px)' : 'blur(0px)',
          transition: 'all 0.3s ease',
          zIndex: 200,
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          borderRadius: '28px 28px 0 0',
          zIndex: 201,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: '#ECEEF0' }} />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px 16px',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 18, color: '#10201A' }}>账户充値</span>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#F3F4F6', border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#6B7C73" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div
          style={{ overflowY: 'auto', flex: 1, padding: '0 20px' }}
          className="no-scrollbar"
        >
          <p style={{ fontSize: 13, color: '#8A9690', marginBottom: 20, lineHeight: 1.6 }}>
            选择到账金额，使用 USDT 链上支付，到账后余额自动更新
          </p>

          {/* Amount grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {AMOUNTS.map(amount => {
              const active = selectedAmount === amount;
              return (
                <button
                  key={amount}
                  onClick={() => setSelectedAmount(amount)}
                  style={{
                    padding: '18px 12px',
                    borderRadius: 18,
                    border: active ? '2px solid #32B579' : '2px solid #ECEEF0',
                    background: active ? '#E8F7EE' : 'white',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: active ? '#32B579' : '#10201A',
                      marginBottom: 4,
                    }}
                  >
                    ¥{amount}
                  </div>
                  {usdtRate && (
                    <div style={{ fontSize: 11, color: '#8A9690' }}>
                      ≈ {(amount / usdtRate).toFixed(2)} USDT
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Recharge info card */}
          <div
            style={{
              background: '#F6F6F8',
              borderRadius: 16,
              padding: '16px',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, color: '#6B7C73' }}>充値到账</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#10201A' }}>¥{selectedAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#6B7C73' }}>当前余额</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#32B579' }}>¥{currentBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* USDT rate warning */}
          {usdtRate === null && (
            <div
              style={{
                background: '#FFF4F4',
                border: '1px solid #FFCCCC',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 16,
                fontSize: 13,
                color: '#E53E3E',
                lineHeight: 1.6,
              }}
            >
              ⚠️ USDT 汇率未配置，暂时无法充値，请联系客服
            </div>
          )}

          {/* Payment method */}
          {usdtRate !== null && (
            <div
              style={{
                border: '2px solid #32B579',
                background: '#E8F7EE',
                borderRadius: 16,
                padding: '14px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36, height: 36,
                    borderRadius: 10,
                    background: 'rgba(50,181,121,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  🪙
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#10201A' }}>USDT 支付</div>
                  <div style={{ fontSize: 12, color: '#6B7C73' }}>链上到账，安全快速</div>
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" fill="#32B579" />
                <path d="M7 12L10.5 15.5L17 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Bottom button - 适配 safe-area */}
        <div
          className="tg-bottom-sheet"
          style={{ padding: '16px 20px' }}
        >
          <button
            disabled={usdtRate === null || loading}
            onClick={() => {
              if (!usdtRate) return;
              // TODO: 接入充値流程
              alert(`将跳转 USDT 支付：${usdtAmount} USDT`);
            }}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 999,
              border: 'none',
              background: usdtRate === null ? '#CCDBD5' : '#32B579',
              color: usdtRate === null ? '#8A9690' : 'white',
              fontWeight: 700,
              fontSize: 16,
              cursor: usdtRate === null ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {usdtRate === null ? '汇率未配置，暂无法充値' : `确认充値 ¥${selectedAmount}`}
          </button>
        </div>
      </div>
    </>
  );
}
