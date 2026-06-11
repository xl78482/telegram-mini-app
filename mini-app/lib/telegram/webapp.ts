/**
 * Telegram WebApp API 工具函数
 * 安全封装，所有 API 调用都做存在性判断，非 Telegram 环境不报错
 */

export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  return (window as any).Telegram?.WebApp ?? null;
}

export function initTelegramWebApp() {
  const tg = getTelegramWebApp();
  if (!tg) return;

  try {
    // 1. 告知 Telegram 应用已准备好
    tg.ready?.();

    // 2. 展开到最大高度
    tg.expand?.();

    // 3. 请求真正全屏（v8.0+ 支持）
    if (tg.isVersionAtLeast?.('8.0')) {
      try {
        tg.requestFullscreen?.();
      } catch {
        // fallback 到 expand
      }
    }

    // 4. 设置颜色
    tg.setHeaderColor?.('#F6F6F8');
    tg.setBackgroundColor?.('#F6F6F8');
    tg.setBottomBarColor?.('#FFFFFF');

  } catch {
    // 静默失败，不影响页面
  }
}

export function isTelegramEnv(): boolean {
  const tg = getTelegramWebApp();
  return !!tg && tg.initData !== '';
}

export function showBackButton(onClick: () => void) {
  const tg = getTelegramWebApp();
  if (!tg) return;
  try {
    tg.BackButton?.show?.();
    tg.BackButton?.onClick?.(onClick);
  } catch {}
}

export function hideBackButton() {
  const tg = getTelegramWebApp();
  if (!tg) return;
  try {
    tg.BackButton?.hide?.();
    tg.BackButton?.offClick?.();
  } catch {}
}

export function getSafeAreaInsets() {
  const tg = getTelegramWebApp();
  if (!tg) return { top: 0, bottom: 0, left: 0, right: 0 };
  const sa = tg.safeAreaInset ?? {};
  const csa = tg.contentSafeAreaInset ?? {};
  return {
    top: Math.max(sa.top ?? 0, csa.top ?? 0),
    bottom: Math.max(sa.bottom ?? 0, csa.bottom ?? 0),
    left: Math.max(sa.left ?? 0, csa.left ?? 0),
    right: Math.max(sa.right ?? 0, csa.right ?? 0),
  };
}
