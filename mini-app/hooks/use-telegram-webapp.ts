'use client';

import { useEffect, useState, useCallback } from 'react';
import { initTelegramWebApp, isTelegramEnv, getSafeAreaInsets } from '../lib/telegram/webapp';

interface TelegramState {
  isReady: boolean;
  isTelegram: boolean;
  safeArea: { top: number; bottom: number; left: number; right: number };
  viewportHeight: number;
}

export function useTelegramWebApp(): TelegramState {
  const [state, setState] = useState<TelegramState>({
    isReady: false,
    isTelegram: false,
    safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
    viewportHeight: 0,
  });

  useEffect(() => {
    initTelegramWebApp();

    const tg = (window as any).Telegram?.WebApp;
    const inTg = isTelegramEnv();
    const safeArea = getSafeAreaInsets();
    const vh = tg?.viewportStableHeight ?? window.innerHeight;

    setState({
      isReady: true,
      isTelegram: inTg,
      safeArea,
      viewportHeight: vh,
    });

    // 监听 viewport 变化
    const handleViewport = () => {
      const newVh = tg?.viewportStableHeight ?? window.innerHeight;
      setState(prev => ({ ...prev, viewportHeight: newVh }));
    };

    // 监听安全区变化（独立引用，确保能正确移除）
    const handleSafeArea = () => {
      setState(prev => ({ ...prev, safeArea: getSafeAreaInsets() }));
    };

    tg?.onEvent?.('viewportChanged', handleViewport);
    tg?.onEvent?.('fullscreenChanged', handleViewport);
    tg?.onEvent?.('safeAreaChanged', handleSafeArea);
    tg?.onEvent?.('contentSafeAreaChanged', handleSafeArea);

    // 清理所有已注册的事件，防止内存泄漏
    return () => {
      tg?.offEvent?.('viewportChanged', handleViewport);
      tg?.offEvent?.('fullscreenChanged', handleViewport);
      tg?.offEvent?.('safeAreaChanged', handleSafeArea);
      tg?.offEvent?.('contentSafeAreaChanged', handleSafeArea);
    };
  }, []);

  return state;
}
