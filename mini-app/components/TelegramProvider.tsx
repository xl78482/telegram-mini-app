'use client';
/* BUILD: 2026-06-12-v5 */

import { useEffect } from 'react';
import { initTelegramWebApp, onViewportEvents } from '../lib/telegram/webapp';

/**
 * 控制按鈕区域保守尺寸——不依赖 Telegram 注入的 CSS 变量，直接用 JS API 读取实际尺寸
 * 并手动写入 CSS 变量。
 */
const CONTROL_RESERVE_TOP = 88; // px

export default function TelegramProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initTelegramWebApp();
    applySafeAreaVars(); // 初始 fallback
    // 监听视口 / 安全区变化（旋转屏幕、进入全屏、键盘弹出、Telegram 回填安全区等），动态重算
    const cleanup = onViewportEvents(applySafeAreaVars);
    return cleanup;
  }, []);

  return <>{children}</>;
}

function applySafeAreaVars() {
  if (typeof window === 'undefined') return;

  const tg = (window as any).Telegram?.WebApp;
  const root = document.documentElement;

  const sa  = tg?.safeAreaInset        ?? {};
  const csa = tg?.contentSafeAreaInset ?? {};

  const saTop  = Number(sa.top  ?? 0);
  const csaTop = Number(csa.top ?? 0);

  /*
   * 计算内容顶部起始位置：
   *   无论 csaTop 有没有値，一律取 max(csaTop, saTop + 88)
   *   这样即使 Telegram 返回了 csaTop，只要它小于 88px + 状态栏，也不会截断内容
   */
  const contentTop = Math.max(
    csaTop,
    saTop + CONTROL_RESERVE_TOP
  );

  root.style.setProperty('--tg-control-reserve-top',        `${CONTROL_RESERVE_TOP}px`);
  root.style.setProperty('--tg-safe-area-inset-top',         `${saTop}px`);
  root.style.setProperty('--tg-content-safe-area-inset-top', `${csaTop}px`);
  root.style.setProperty('--app-safe-top',                   `${saTop}px`);
  root.style.setProperty('--app-content-top',                `${contentTop}px`);

  const saBottom  = Number(sa.bottom  ?? 0);
  const csaBottom = Number(csa.bottom ?? 0);
  root.style.setProperty('--tg-safe-area-inset-bottom',  `${saBottom}px`);
  root.style.setProperty('--app-safe-bottom',            `${Math.max(saBottom, csaBottom)}px`);
}
