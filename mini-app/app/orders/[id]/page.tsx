'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useBackButton } from '../../../hooks/use-back-button';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  PENDING:    { label: '待支付', bg: '#FFF4E5', color: '#F59E0B', icon: '⏳' },
  PAID:       { label: '已支付', bg: '#EEF3FF', color: '#4F74E8', icon: '✅' },
  PROCESSING: { label: '处理中', bg: '#EEF3FF', color: '#4F74E8', icon: '⚙️' },
  COMPLETED:  { label: '已完成', bg: '#E8F7EE', color: '#2EA66F', icon: '✅' },
  CANCELLED:  { label: '已取消', bg: '#F5F5F5', color: '#8A9690', icon: '❌' },
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {}
      }}
      style={{
        padding: '4px 12px', borderRadius: 999,
        fontSize: 12, fontWeight: 600,
        background: copied ? '#E8F7EE' : '#F3F4F6',
        color: copied ? '#32B579' : '#6B7C73',
        border: 'none', cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {copied ? '已复制 ✓' : '复制'}
    </button>
  );
}

export default function OrderDetailPage() {
  useBackButton();
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then(r => r.json())
      .then(data => { setOrder(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return (
    <div className="tg-content-top" style={{ padding: '16px', background: '#F6F6F8', minHeight: '100dvh' }}>
      <div className="skeleton" style={{ height: 80, borderRadius: 20, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 120, borderRadius: 20, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 160, borderRadius: 20 }} />
    </div>
  );

  if (!order) return (
    <div className="tg-content-top" style={{ padding: '40px 20px', textAlign: 'center', color: '#8A9690' }}>
      订单不存在
    </div>
  );

  const status = STATUS_MAP[order.status] || { label: order.status, bg: '#F5F5F5', color: '#8A9690', icon: '•' };
  const allKeys = order.items?.flatMap((it: any) => it.cardKeys || it.keys || []) ?? [];

  return (
    <div
      className="tg-content-top"
      style={{
        background: '#F6F6F8',
        minHeight: '100dvh',
        paddingBottom: `calc(80px + max(0px, var(--tg-safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))))`,
      }}
    >
      {/* 订单标题 */}
      <div style={{ padding: '16px 16px 8px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#10201A', margin: 0 }}>订单详情</h2>
      </div>

      {/* 状态卡 */}
      <div style={{ margin: '0 12px 12px' }}>
        <div style={{
          background: status.bg, borderRadius: 20,
          padding: '18px', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 32 }}>{status.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: status.color }}>{status.label}</div>
            <div style={{ fontSize: 12, color: '#8A9690', marginTop: 2 }}>订单 #{order.id}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: status.color }}>
              ¥{(order.totalAmount ?? order.total ?? 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      {order.items?.map((item: any, idx: number) => (
        <div key={idx} style={{ margin: '0 12px 12px' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '16px', boxShadow: '0 1px 6px rgba(16,32,26,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#10201A', flex: 1 }}>{item.productName}</span>
              <span style={{ fontWeight: 700, color: '#32B579' }}>¥{item.price?.toFixed(2)} × {item.quantity}</span>
            </div>

            {/* 卡密列表 */}
            {(item.cardKeys || item.keys || []).length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: '#8A9690', marginBottom: 8 }}>卡密 / 密钥</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(item.cardKeys || item.keys || []).map((key: string, ki: number) => (
                    <div
                      key={ki}
                      style={{
                        background: '#F6F6F8',
                        borderRadius: 10, padding: '10px 12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      }}
                    >
                      <span style={{
                        fontSize: 13, fontFamily: 'monospace',
                        color: '#10201A', flex: 1,
                        wordBreak: 'break-all',
                      }}>{key}</span>
                      <CopyBtn text={key} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* 时间信息 */}
      <div style={{ margin: '0 12px 12px' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '14px 16px', boxShadow: '0 1px 6px rgba(16,32,26,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#8A9690' }}>创建时间</span>
            <span style={{ fontSize: 13, color: '#10201A' }}>{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
          </div>
          {order.updatedAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#8A9690' }}>更新时间</span>
              <span style={{ fontSize: 13, color: '#10201A' }}>{new Date(order.updatedAt).toLocaleString('zh-CN')}</span>
            </div>
          )}
        </div>
      </div>

      {/* 底部复制全部卡密按钮 */}
      {allKeys.length > 0 && (
        <div
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'white', borderTop: '1px solid #ECEEF0',
            padding: `12px 16px max(16px, var(--tg-safe-area-inset-bottom, env(safe-area-inset-bottom, 16px)))`,
            zIndex: 90,
          }}
        >
          <button
            onClick={() => {
              navigator.clipboard.writeText(allKeys.join('\n')).catch(() => {});
            }}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 999, border: 'none',
              background: '#32B579', color: 'white',
              fontWeight: 700, fontSize: 16, cursor: 'pointer',
            }}
          >
            一键复制所有卡密
          </button>
        </div>
      )}
    </div>
  );
}
