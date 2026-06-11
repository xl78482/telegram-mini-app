'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ text, size = 16 }: { text: string; size?: number }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        background: copied ? '#E8F7F0' : '#F6F6F8',
        border: 'none',
        borderRadius: 8,
        padding: '6px 8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        color: copied ? '#2EA66F' : '#8A9690',
        fontSize: 12,
        fontWeight: 600,
        flexShrink: 0,
        transition: 'all 0.15s',
      }}
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
      {copied ? '已复制' : '复制'}
    </button>
  )
}
