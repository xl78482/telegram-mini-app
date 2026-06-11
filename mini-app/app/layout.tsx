import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: '财神商盟',
  description: 'Telegram Mini App 发卡商城',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body style={{ background: '#F6F6F8', color: '#10201A' }}>
        <Providers>
          <div style={{ margin: '0 auto', maxWidth: '28rem', minHeight: '100dvh', background: '#F6F6F8', position: 'relative' }}>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
