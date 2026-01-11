import type { Metadata } from 'next'
import './globals.css'
import { Suspense } from 'react'
import { Gabarito } from 'next/font/google'
import { MSWProvider } from '@/components/MSWProvider'
import { SessionProvider } from '@/components/SessionProvider'
import { QueryProvider } from '@/components/QueryProvider'
import StartupInitializer from '@/components/StartupInitializer'
import ClientShell from '@/components/layout/ClientShell'

const gabarito = Gabarito({
  subsets: ['latin'],
  variable: '--font-gabarito',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'OSM Tools',
  description: 'Scout Event Management Dashboard',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={gabarito.variable}>
      <body className="bg-background text-foreground font-sans antialiased">
        <MSWProvider>
          <SessionProvider>
            <QueryProvider>
              <StartupInitializer />
              <Suspense fallback={<div className="min-h-screen" />}>
                <ClientShell>
                  {children}
                </ClientShell>
              </Suspense>
            </QueryProvider>
          </SessionProvider>
        </MSWProvider>
      </body>
    </html>
  )
}
