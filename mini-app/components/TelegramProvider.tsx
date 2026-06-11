'use client';

import { useEffect } from 'react';
import { initTelegramWebApp, getSafeAreaInsets } from '../lib/telegram/webapp';

/**
 * TelegramProvider
 * 初始化 Telegram WebApp SDK，并将实际安全区尺寸写入 CSS 变量。
 *
 * 为什么需要手动写入？
 *   Telegram 的 --tg-safe-area-inset-top / --tg-content-safe-area-inset-top
 *   是由 Telegram 客户端注入的 CSS 变量，但部分设备/版本可能不就绪注入。
 *   我们通过 JS API 读取实际尺寸并手动写入，确保全部设备都能正确应用。
 */
export default function TelegramProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initTelegramWebApp();
    applySafeAreaVars();
  }, []);

  return <>{children}</>;
}

function applySafeAreaVars() {
  if (typeof window === 'undefined') return;

  const tg = (window as any).Telegram?.WebApp;
  const root = document.documentElement;

  // 读取 Telegram JS API 的安全区尺寸
  const sa  = tg?.safeAreaInset        ?? {}; // 状态栏/灵动岛
  const csa = tg?.contentSafeAreaInset ?? {}; // 控制按钒 + 状态栏

  const saTop  = Number(sa.top  ?? 0);
  const csaTop = Number(csa.top ?? 0);

  /*
   * contentSafeAreaInset.top 已包含：关闭按钒 + 返回按钒 + 状态栏。
   * 这是内容应该开始展示的最小 y 坐标。
   * fallback: 如果 csaTop === 0（非全屏模式或旧版 Telegram），
   *           则用 saTop + 52px 作为保守布局
   */
  const contentTop = csaTop > 0
    ? csaTop
    : saTop > 0
      ? saTop + 52
      : 64; // 最后 fallback: 非 Telegram 环境或极事情况

  root.style.setProperty('--tg-safe-area-inset-top',         `${saTop}px`);
  root.style.setProperty('--tg-content-safe-area-inset-top', `${csaTop}px`);
  root.style.setProperty('--app-safe-top',                   `${saTop}px`);
  root.style.setProperty('--app-content-top',                `${contentTop}px`);

  root.style.setProperty('--tg-safe-area-inset-bottom',
    `${Number(sa.bottom  ?? 0)}px`);
  root.style.setProperty('--app-safe-bottom',
    `${Math.max(Number(sa.bottom ?? 0), Number(csa.bottom ?? 0))}px`);
}
