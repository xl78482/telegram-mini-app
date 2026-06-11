'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, ClipboardList, User } from 'lucide-react'

const tabs = [
  { href: '/', icon: ShoppingBag, label: '商城' },
  { href: '/orders', icon: ClipboardList, label: '订单' },
  { href: '/profile', icon: User, label: '我的' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="bottom-nav">
      <div style={{ display: 'flex', width: '100%' }}>
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`bottom-nav-item ${active ? 'active' : ''}`}
            >
              <div className="bottom-nav-icon-wrap">
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
