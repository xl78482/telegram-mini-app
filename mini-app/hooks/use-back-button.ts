'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { showBackButton, hideBackButton } from '../lib/telegram/webapp';

/**
 * 在详情页使用 Telegram 官方返回按钮
 * 组件卸载时自动隐藏
 */
export function useBackButton() {
  const router = useRouter();

  useEffect(() => {
    const handleBack = () => router.back();
    showBackButton(handleBack);

    return () => {
      hideBackButton();
    };
  }, [router]);
}
