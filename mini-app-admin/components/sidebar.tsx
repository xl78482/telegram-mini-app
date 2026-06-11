'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, ClipboardList, Users, LogOut, KeySquare } from 'lucide-react'

const nav = [
  { href: '/',         icon: LayoutDashboard, label: '数据概览' },
  { href: '/products', icon: Package,         label: '商品管理' },
  { href: '/orders',   icon: ClipboardList,   label: '订单管理' },
  { href: '/users',    icon: Users,           label: '用户管理' },
  { href: '/cards',    icon: KeySquare,       label: '卡密库存' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-white/10 bg-[#111111] fixed left-0 top-0">
      <div className="flex h-14 items-center px-5 border-b border-white/10">
        <span className="font-bold text-white">✨ Admin</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active ? 'bg-blue-500/15 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <button onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-white/5 hover:text-white transition-colors">
          <LogOut size={16} />
          退出登录
        </button>
      </div>
    </aside>
  )
}
