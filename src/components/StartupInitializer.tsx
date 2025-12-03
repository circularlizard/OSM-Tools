'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useStore } from '@/store/use-store'

/**
 * StartupInitializer
 *
 * Client component that initializes the Zustand store with user data.
 * Fetches full section data from Redis via API endpoint.
 *
 * SAFETY: Only processes data when user is authenticated.
 * The OAuth resource endpoint provides sections/scopes stored in Redis.
 *
 * Render at app layout level under SessionProvider and QueryProvider.
 */
export default function StartupInitializer() {
  const { data: session, status } = useSession()
  const setUserRole = useStore((s) => s.setUserRole)
  const setAvailableSections = useStore((s) => s.setAvailableSections)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchSections() {
      if (status !== 'authenticated' || !session?.user?.id || loading) return
      
      setLoading(true)
      try {
        // Fetch full section data from Redis
        const response = await fetch('/api/auth/oauth-data')
        if (!response.ok) {
          console.error('Failed to fetch OAuth data:', response.statusText)
          return
        }
        
        const data = await response.json()
        const sections = data.sections || []
        
        // Determine role based on permissions
        const hasEventsAccess = sections.some((s: any) => s.upgrades.events)
        const hasProgrammeAccess = sections.some((s: any) => s.upgrades.programme)
        
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
        console.error('Error fetching OAuth data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSections()
  }, [session, status, loading, setUserRole, setAvailableSections])

  return null
}
