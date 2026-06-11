'use client';

import { useEffect } from 'react';
import { initTelegramWebApp } from '../lib/telegram/webapp';

export default function TelegramProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 页面加载时立即初始化
    initTelegramWebApp();
  }, []);

  return <>{children}</>;
}
