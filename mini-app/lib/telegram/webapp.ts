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

    // 4. 关闭垂直滑动手势，避免滚动列表时误触下拉关闭小程序（v7.7+）
    if (tg.isVersionAtLeast?.('7.7')) {
      try { tg.disableVerticalSwipes?.(); } catch {}
    }

    // 5. 设置颜色
    tg.setHeaderColor?.('#F6F6F8');
    tg.setBackgroundColor?.('#F6F6F8');
    tg.setBottomBarColor?.('#FFFFFF');

  } catch {
    // 静默失败，不影响页面
  }
}

/* ============================================
   触觉反馈（Haptic Feedback）——丝滑交互核心
   所有 API 都做存在性 + 版本判断，非 Telegram 环境静默
   ============================================ */

type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NotificationType = 'success' | 'warning' | 'error';

export function hapticImpact(style: ImpactStyle = 'light') {
  const tg = getTelegramWebApp();
  try { tg?.HapticFeedback?.impactOccurred?.(style); } catch {}
}

export function hapticNotification(type: NotificationType = 'success') {
  const tg = getTelegramWebApp();
  try { tg?.HapticFeedback?.notificationOccurred?.(type); } catch {}
}

export function hapticSelection() {
  const tg = getTelegramWebApp();
  try { tg?.HapticFeedback?.selectionChanged?.(); } catch {}
}

/* ============================================
   动态安全区 / 视口事件监听
   返回取消监听的清理函数
   ============================================ */

export function onViewportEvents(handler: () => void): () => void {
  const tg = getTelegramWebApp();
  if (!tg?.onEvent) return () => {};
  const events = ['viewportChanged', 'safeAreaChanged', 'contentSafeAreaChanged', 'fullscreenChanged'];
  events.forEach(evt => { try { tg.onEvent(evt, handler); } catch {} });
  return () => {
    events.forEach(evt => { try { tg.offEvent?.(evt, handler); } catch {} });
  };
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
