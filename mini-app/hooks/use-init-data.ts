'use client'
import { useEffect, useState } from 'react'

export function useInitData() {
  const [initData, setInitData] = useState('')
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) {
      setInitData(window.Telegram.WebApp.initData)
    }
  }, [])
  return initData
}
