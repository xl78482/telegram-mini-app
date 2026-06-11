'use client'
import { useState } from 'react'

export function CopyButton({ text, label = '复制', size = 14 }: { text: string; label?: string; size?: number }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for older devices
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        background: copied ? '#E8F7F0' : '#F6F6F8',
        border: copied ? '1px solid #b8e6d4' : '1px solid #EBEBEB',
        borderRadius: 8,
        padding: '5px 10px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        color: copied ? '#2EA66F' : '#8A9690',
        fontSize: size,
        fontWeight: 600,
        flexShrink: 0,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
      )}
      {copied ? '已复制' : label}
    </button>
  )
}
