'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useStore } from '@/store/use-store'

/**
 * StartupInitializer
 *
 * Client component that initializes the Zustand store with user data.
 * Fetches full section data from Redis via API endpoint.
 *
 * SAFETY: Only fetches data once when user is authenticated.
 * Uses a ref to prevent duplicate requests.
 *
 * Render at app layout level under SessionProvider and QueryProvider.
 */
export default function StartupInitializer() {
  const { data: session, status } = useSession()
  const setUserRole = useStore((s) => s.setUserRole)
  const setAvailableSections = useStore((s) => s.setAvailableSections)
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Safety checks: only fetch once when authenticated
    if (status !== 'authenticated' || !session?.user || hasInitialized.current) {
      return
    }

    const userId = (session.user as any).id
    if (!userId) {
      return
    }

    hasInitialized.current = true

    async function fetchSections() {
      try {
        // Fetch full section data from Redis
        const response = await fetch('/api/auth/oauth-data')
        if (!response.ok) {
          console.error('[StartupInitializer] Failed to fetch OAuth data:', response.status, response.statusText)
          return
        }
        
        const data = await response.json()
        const sections = data.sections || []
        
        // Determine role based on permissions
        const hasEventsAccess = sections.some((s: any) => s.upgrades?.events)
        const hasProgrammeAccess = sections.some((s: any) => s.upgrades?.programme)
        
        // Role heuristic: events + programme = standard, events only = readonly
        const role = hasEventsAccess && hasProgrammeAccess ? 'standard' : 'readonly'
        setUserRole(role)

        // Transform OAuth sections to store format
        const storeSections = sections.map((s: any) => ({
          sectionId: String(s.section_id),
          sectionName: s.section_name,
          sectionType: s.section_type,
        }))
        setAvailableSections(storeSections)
      } catch (error) {
        console.error('[StartupInitializer] Error fetching OAuth data:', error)
        hasInitialized.current = false // Allow retry on error
      }
    }

    fetchSections()
  }, [status, session, setUserRole, setAvailableSections])

  return null
}
