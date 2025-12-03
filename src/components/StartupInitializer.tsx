'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useStore } from '@/store/use-store'

/**
 * StartupInitializer
 *
 * Client component that initializes the Zustand store with user data from the session.
 * No API calls needed - all data comes from the OAuth /oauth/resource endpoint
 * which is stored in the NextAuth session.
 *
 * SAFETY: Only processes data when user is authenticated.
 * The OAuth resource endpoint provides:
 * - User info (id, name, email)
 * - Sections with terms and permissions
 * - Scopes
 *
 * Render at app layout level under SessionProvider and QueryProvider.
 */
export default function StartupInitializer() {
  const { data: session, status } = useSession()
  const setUserRole = useStore((s) => s.setUserRole)
  const setAvailableSections = useStore((s) => s.setAvailableSections)

  useEffect(() => {
    if (status === 'authenticated' && session?.sections) {
      // Determine role based on permissions
      // Check if user has admin-level access (events permission on any section)
      const hasEventsAccess = session.sections.some(s => s.upgrades.events)
      const hasProgrammeAccess = session.sections.some(s => s.upgrades.programme)
      
      // Role heuristic: events + programme = standard, events only = readonly
      const role = hasEventsAccess && hasProgrammeAccess ? 'standard' : 'readonly'
      setUserRole(role)

      // Transform OAuth sections to store format
      const sections = session.sections.map((s) => ({
        sectionId: String(s.section_id),
        sectionName: s.section_name,
        sectionType: s.section_type,
      }))
      setAvailableSections(sections)
    }
  }, [session, status, setUserRole, setAvailableSections])

  return null
}
