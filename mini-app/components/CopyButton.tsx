'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ text, size = 16 }: { text: string; size?: number }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
        color: copied ? '#2EA66F' : '#8A9690', transition: 'color 0.2s',
        display: 'flex', alignItems: 'center',
      }}
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
    </button>
  )
}
