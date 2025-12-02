import type { Metadata } from 'next'
import './globals.css'
import { MSWProvider } from '@/components/MSWProvider'
import { QueryProvider } from '@/components/QueryProvider'
import StartupInitializer from '@/components/StartupInitializer'
import SectionPickerModal from '@/components/layout/SectionPickerModal'

export const metadata: Metadata = {
  title: 'SEEE Expedition Dashboard',
  description: 'Scout Event Management Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <MSWProvider>
          <QueryProvider>
            <StartupInitializer />
            <SectionPickerModal />
            {children}
          </QueryProvider>
        </MSWProvider>
      </body>
    </html>
  )
}
