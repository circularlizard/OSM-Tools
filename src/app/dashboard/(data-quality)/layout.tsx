'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/use-store'

/**
 * Data Quality App Layout
 * 
 * Sets the currentApp to 'data-quality' for all routes within this group.
 * The ClientShell handles admin-only guards and section selector rendering.
 */
export default function DataQualityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentApp = useStore((s) => s.currentApp)
  const setCurrentApp = useStore((s) => s.setCurrentApp)

  useEffect(() => {
    if (currentApp !== 'data-quality') {
      setCurrentApp('data-quality')
    }
  }, [currentApp, setCurrentApp])

  return <>{children}</>
}
