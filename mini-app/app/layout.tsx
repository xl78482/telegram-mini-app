import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mini Shop',
  description: 'Telegram Mini App Shop',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body className={`${inter.className} bg-[#000000] text-white antialiased`}>
        <Providers>
          <div className="mx-auto max-w-md min-h-screen pb-20">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
