'use client';

import { useEffect, useState } from 'react';
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

    tg?.onEvent?.('viewportChanged', handleViewport);
    tg?.onEvent?.('fullscreenChanged', handleViewport);
    tg?.onEvent?.('safeAreaChanged', () => {
      setState(prev => ({ ...prev, safeArea: getSafeAreaInsets() }));
    });
    tg?.onEvent?.('contentSafeAreaChanged', () => {
      setState(prev => ({ ...prev, safeArea: getSafeAreaInsets() }));
    });

    return () => {
      tg?.offEvent?.('viewportChanged', handleViewport);
    };
  }, []);

  return state;
}
