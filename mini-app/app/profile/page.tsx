'use client'
import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { useInitData } from '@/hooks/use-init-data'
import { Wallet, ClipboardList, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: number; tgId: string; username?: string | null
  firstName?: string | null; lastName?: string | null; balance: string
}

export default function ProfilePage() {
  const initData = useInitData()
  const [user, setUser] = useState<User | null>(null)
  const [rechargeAmt, setRechargeAmt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!initData) return
    fetch('/api/user', { headers: { 'x-init-data': initData } })
      .then(r => r.json()).then(data => { if (data.id) setUser(data) })
  }, [initData])

  async function handleRecharge() {
    if (!initData || !rechargeAmt || Number(rechargeAmt) <= 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/user/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
        body: JSON.stringify({ amount: Number(rechargeAmt) }),
      })
      const data = await res.json()
      if (res.ok) { setMsg('充值申请已提交，请等待管理员审核'); setRechargeAmt('') }
      else setMsg(data.error)
    } finally {
      setSubmitting(false)
      setTimeout(() => setMsg(''), 4000)
    }
  }

  const displayName = user ? (user.firstName ?? '') + (user.lastName ? ' ' + user.lastName : '') || user.username || 'User' : '...'

  return (
    <>
      <div className="sticky top-0 z-10 bg-[#000]/80 backdrop-blur-md px-4 py-4">
        <h1 className="text-xl font-bold">我的</h1>
      </div>
      <div className="px-4 space-y-3">
        {/* 用户信息 */}
        <div className="rounded-2xl bg-[#1c1c1e] p-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20 text-2xl">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-semibold text-white">{displayName}</p>
            {user?.username && <p className="text-sm text-gray-500">@{user.username}</p>}
          </div>
        </div>

        {/* 余额 */}
        <div className="rounded-2xl bg-[#1c1c1e] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-blue-400" />
            <span className="text-xs text-gray-500">账户余额</span>
          </div>
          <p className="text-3xl font-bold text-white">¥{user ? Number(user.balance).toFixed(2) : '--'}</p>
        </div>

        {/* 充值 */}
        <div className="rounded-2xl bg-[#1c1c1e] p-4">
          <p className="text-xs text-gray-500 mb-3">申请充值</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={rechargeAmt}
              onChange={e => setRechargeAmt(e.target.value)}
              placeholder="输入金额"
              className="flex-1 rounded-xl bg-[#2c2c2e] px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleRecharge}
              disabled={submitting}
              className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? '...' : '提交'}
            </button>
          </div>
          {msg && <p className="mt-2 text-xs text-green-400">{msg}</p>}
        </div>

        {/* 快捷入口 */}
        <Link href="/orders" className="flex items-center justify-between rounded-2xl bg-[#1c1c1e] p-4 active:opacity-70">
          <div className="flex items-center gap-3">
            <ClipboardList size={18} className="text-gray-400" />
            <span className="text-sm">我的订单</span>
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </Link>
      </div>
      <BottomNav />
    </>
  )
}
