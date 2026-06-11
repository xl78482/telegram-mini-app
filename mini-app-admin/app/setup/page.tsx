'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle } from 'lucide-react'

export default function SetupPage() {
  const router = useRouter()
  const [qr, setQr] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/admin/auth/setup')
      .then(r => r.json())
      .then(data => {
        if (data.alreadySetup) { router.replace('/login'); return }
        setQr(data.qrCode)
        setSecret(data.secret)
      })
  }, [router])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (res.ok) { setDone(true); setTimeout(() => router.push('/login'), 2000) }
      else setError(data.error ?? '验证失败')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <CheckCircle className="text-green-400" size={48} />
      <p className="text-lg font-semibold text-white">绑定成功！正在跳转登录...</p>
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-white">绑定两步验证</h1>
        <p className="mb-6 text-center text-sm text-gray-500">使用 Google Authenticator 或 Telegram 扫描二维码</p>

        {qr ? (
          <div className="mb-6 flex flex-col items-center">
            <div className="rounded-2xl bg-white p-3">
              <Image src={qr} alt="TOTP QR" width={200} height={200} />
            </div>
            <div className="mt-4 rounded-xl bg-white/5 px-4 py-2">
              <p className="text-xs text-gray-500 mb-1">手动输入密钥：</p>
              <p className="font-mono text-xs text-white break-all">{secret}</p>
            </div>
          </div>
        ) : (
          <div className="mb-6 flex h-52 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="输入 App 中的 6 位码"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl font-mono tracking-widest text-white placeholder-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={code.length !== 6 || loading || !secret}
            className="w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {loading ? '验证中...' : '确认绑定'}
          </button>
        </form>
      </div>
    </div>
  )
}
