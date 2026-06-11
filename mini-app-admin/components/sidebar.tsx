'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, ClipboardList, Users, LogOut, KeySquare, Menu, X } from 'lucide-react'

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
  const [mobileOpen, setMobileOpen] = useState(false)

  async function logout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const NavLinks = () => (
    <>
      <div className="flex h-14 items-center px-5 border-b border-white/10 shrink-0">
        <span className="font-bold text-white">✨ Admin</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active ? 'bg-blue-500/15 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-white/10 shrink-0">
        <button onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-white/5 hover:text-white transition-colors">
          <LogOut size={16} />
          退出登录
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* PC 端固定侧边栏 */}
      <aside className="hidden md:flex h-screen w-56 flex-col border-r border-white/10 bg-[#111111] fixed left-0 top-0">
        <NavLinks />
      </aside>

      {/* 手机端顶部导航栏 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-12 items-center justify-between bg-[#111111] border-b border-white/10 px-4">
        <span className="font-bold text-white text-sm">✨ Admin</span>
        <button onClick={() => setMobileOpen(v => !v)} className="text-gray-400 hover:text-white p-1">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 手机端抽屉菜单遮罩 */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 手机端抽屉菜单内容 */}
      <aside className={`md:hidden fixed top-0 left-0 h-full w-56 flex flex-col border-r border-white/10 bg-[#111111] z-50 transform transition-transform duration-300 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <NavLinks />
      </aside>
    </>
  )
}
