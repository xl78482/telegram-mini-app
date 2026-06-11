export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        platform?: string;
        initData?: string;
        ready?: () => void;
        expand?: () => void;
        requestFullscreen?: () => void;
        disableVerticalSwipes?: () => void;
        enableVerticalSwipes?: () => void;
        isVersionAtLeast?: (version: string) => boolean;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        setBottomBarColor?: (color: string) => void;
        HapticFeedback?: {
          impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred?: (type: 'success' | 'warning' | 'error') => void;
          selectionChanged?: () => void;
        };
        BackButton?: {
          show?: () => void;
          hide?: () => void;
          onClick?: (callback: () => void) => void;
          offClick?: (callback?: () => void) => void;
        };
        onEvent?: (eventType: string, callback: () => void) => void;
        offEvent?: (eventType: string, callback: () => void) => void;
        safeAreaInset?: {
          top?: number;
          bottom?: number;
          left?: number;
          right?: number;
        };
        contentSafeAreaInset?: {
          top?: number;
          bottom?: number;
          left?: number;
          right?: number;
        };
        viewportStableHeight?: number;
      };
    };
  }
}
