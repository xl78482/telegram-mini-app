'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 在详情页使用 Telegram 官方返回按鈕
 * 组件卸载时自动隐藏，并正确移除监听防止残留
 */
export function useBackButton() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    tg.BackButton?.show?.();
    tg.BackButton?.onClick?.(handleBack); // 注册监听

    return () => {
      // 必须传入相同的函数引用才能正确移除
      tg.BackButton?.offClick?.(handleBack);
      tg.BackButton?.hide?.();
    };
  }, [handleBack]);
}
