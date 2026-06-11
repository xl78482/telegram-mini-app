'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { showBackButton, hideBackButton } from '../lib/telegram/webapp';

/**
 * 在详情页使用 Telegram 官方返回按钮
 * 组件卸载时自动隐藏
 */
export function useBackButton() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    showBackButton(handleBack);
    return () => {
      hideBackButton();
    };
  }, [handleBack]);
}
