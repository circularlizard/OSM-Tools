import type { Metadata } from 'next'
import './globals.css'
import { MSWProvider } from '@/components/MSWProvider'
import { QueryProvider } from '@/components/QueryProvider'
import StartupInitializer from '@/components/StartupInitializer'
import SectionPickerModal from '@/components/layout/SectionPickerModal'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'

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
            <Header />
            <div className="flex">
              <Sidebar />
              <main className="flex-1">{children}</main>
            </div>
          </QueryProvider>
        </MSWProvider>
      </body>
    </html>
  )
}
