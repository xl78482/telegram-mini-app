import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import TelegramProvider from '@/components/TelegramProvider';

export const metadata: Metadata = {
  title: '财神商盟',
  description: 'Telegram Mini App 发卡商城',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <head>
        {/* Telegram WebApp SDK - 必须在最前加载 */}
        <script src="https://telegram.org/js/telegram-web-app.js" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#F6F6F8" />
      </head>
      <body>
        <Providers>
          <TelegramProvider>
            {/* 去掉 maxWidth 限制，允许全屏展开 */}
            <div className="tg-app">
              {children}
            </div>
          </TelegramProvider>
        </Providers>
      </body>
    </html>
  );
}
