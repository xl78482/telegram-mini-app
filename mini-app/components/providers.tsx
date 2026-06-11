'use client'

import { useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    tg?.ready?.()
    tg?.expand?.()
  }, [])

  return <>{children}</>
}
