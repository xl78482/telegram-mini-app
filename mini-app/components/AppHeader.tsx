'use client';

import { useState, useEffect } from 'react';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onClose?: () => void;
}

export default function AppHeader({
  title = '财神商盟',
  subtitle = '小程序',
  onClose,
}: AppHeaderProps) {
  const [isTelegram, setIsTelegram] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.platform !== 'unknown') {
      setIsTelegram(true);
    }
  }, []);

  // In real Telegram env, the native header is shown; we still show our custom one for branding
  return (
    <header
      style={{
        background: 'white',
        borderBottom: '1px solid #ECEEF0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          position: 'relative',
        }}
      >
        {/* Left: Close */}
        <button
          onClick={onClose}
          style={{
            fontSize: 15,
            color: '#6B7C73',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
            minWidth: 44,
          }}
        >
          关闭
        </button>

        {/* Center: Title */}
        <div style={{ textAlign: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#10201A', lineHeight: 1.2 }}>{title}</div>
          <div style={{ fontSize: 12, color: '#8A9690', marginTop: 2 }}>{subtitle}</div>
        </div>

        {/* Right: More button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#F6F6F8',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 3,
          }}
          aria-label="更多"
        >
          {[0,1,2].map(i => (
            <span
              key={i}
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: '#6B7C73',
                display: 'block',
              }}
            />
          ))}
        </button>
      </div>
    </header>
  );
}
