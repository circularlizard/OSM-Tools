'use client'

import { useEffect, useState } from 'react'

/**
 * MSW Provider
 * 
 * Conditionally initializes Mock Service Worker in development mode.
 * This allows the app to use mock data during development/testing
 * without affecting production builds.
 */
export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(false)

  useEffect(() => {
    const initMSW = async () => {
      // Enable MSW only when explicitly enabled via public env
      const enableMsw = process.env.NEXT_PUBLIC_USE_MSW === 'true'
      if (!enableMsw) {
        setMswReady(true)
        return
      }

      try {
        const { worker } = await import('@/mocks/browser')
        // Use an explicit service worker URL to avoid scope issues under App Router and HTTPS
        const startPromise = worker.start({
          onUnhandledRequest: 'bypass',
          serviceWorker: {
            url: '/mockServiceWorker.js',
          },
        })

        // Add a timeout guard so UI doesn't hang if SW fails to start
        const timeout = new Promise<void>((resolve) =>
          setTimeout(() => resolve(), 1500)
        )
        await Promise.race([startPromise, timeout])
      } catch (err) {
        // In case MSW fails to initialize, proceed without blocking the UI
        console.warn('[MSW] Failed to start mock service worker:', err)
      } finally {
        setMswReady(true)
      }
    }

    initMSW()
  }, [])

  // Show loading state only when MSW is explicitly enabled
  if (!mswReady && process.env.NEXT_PUBLIC_USE_MSW === 'true') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Initializing mock service worker...</p>
      </div>
    )
  }

  return <>{children}</>
}
