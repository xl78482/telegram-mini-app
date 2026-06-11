'use client';

import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  label?: string;
  style?: React.CSSProperties;
}

export default function CopyButton({ text, label = '复制', style }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '5px 14px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        border: '1.5px solid #32B579',
        background: copied ? '#E8F7EE' : 'transparent',
        color: '#32B579',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        ...style,
      }}
    >
      {copied ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M5 12L10 17L19 7" stroke="#32B579" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          已复制
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="9" width="11" height="11" rx="2" stroke="#32B579" strokeWidth="2" />
            <path d="M5 15H4C2.9 15 2 14.1 2 13V4C2 2.9 2.9 2 4 2H13C14.1 2 15 2.9 15 4V5" stroke="#32B579" strokeWidth="2" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
