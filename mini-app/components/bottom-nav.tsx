'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, ClipboardList, User } from 'lucide-react'

const tabs = [
  { href: '/', icon: ShoppingBag, label: '商店' },
  { href: '/orders', icon: ClipboardList, label: '订单' },
  { href: '/profile', icon: User, label: '我的' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#1c1c1e]/95 backdrop-blur-md">
      <div className="flex">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                active ? 'text-blue-400' : 'text-gray-500'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
