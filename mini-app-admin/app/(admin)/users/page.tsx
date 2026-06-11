'use client'
import { useEffect, useState } from 'react'
import { Wallet, AlertCircle } from 'lucide-react'

interface User {
  id: number; tgId: string; username?: string | null
  firstName?: string | null; balance: string
  createdAt: string; _count: { orders: number }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rechargeModal, setRechargeModal] = useState<{ userId: number; name: string } | null>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        setError(e.error ?? `获取失败(${res.status})`)
        return
      }
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('网络错误，请检查连接')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleRecharge() {
    if (!rechargeModal || !amount) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: rechargeModal.userId, amount: Number(amount), note }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); setToast(e.error ?? '充値失败'); return }
      setRechargeModal(null)
      setAmount('')
      setNote('')
      setToast('充値成功')
      await load()
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg">
          {toast}
          <button onClick={() => setToast('')} className="ml-3 opacity-70">×</button>
        </div>
      )}

      <h1 className="text-xl font-bold">用户管理</h1>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <span className="animate-spin mr-2">⧗</span> 加载中...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
          <button onClick={load} className="ml-auto text-xs underline">重试</button>
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-2xl border border-white/10 bg-[#111] overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-white/10 text-gray-500">
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">用户</th>
                <th className="px-4 py-3 text-left">TG ID</th>
                <th className="px-4 py-3 text-right">余额</th>
                <th className="px-4 py-3 text-right">订单数</th>
                <th className="px-4 py-3 text-left">注册时间</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">暂无用户</td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-white/3">
                  <td className="px-4 py-3 text-gray-500">{u.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-white">{u.firstName ?? 'Unknown'}</p>
                    {u.username && <p className="text-xs text-gray-500">@{u.username}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.tgId}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-400">¥{Number(u.balance).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{u._count.orders}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setRechargeModal({ userId: u.id, name: u.firstName ?? u.username ?? 'User' })}
                      className="flex items-center gap-1 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/20 mx-auto"
                    >
                      <Wallet size={12} /> 充値
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rechargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#1a1a1a] p-6" style={{ width: 'calc(100vw - 32px)', maxWidth: 400 }}>
            <h2 className="mb-4 text-lg font-semibold">给 {rechargeModal.name} 充値</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">充値金额</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">备注（可选）</label>
                <input value={note} onChange={e => setNote(e.target.value)}
                  placeholder="手动充値"
                  className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setRechargeModal(null)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400">取消</button>
              <button onClick={handleRecharge} disabled={saving || !amount}
                className="flex-1 rounded-xl bg-green-500 py-2.5 text-sm font-medium text-white disabled:opacity-50">
                {saving ? '...' : '确认充値'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
