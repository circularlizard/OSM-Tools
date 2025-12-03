'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { getStartupData } from '@/lib/api'
import { useStore } from '@/store/use-store'

/**
 * StartupInitializer
 *
 * Client component that fetches startup data on mount and
 * populates the Zustand store with user role and available sections.
 *
 * SAFETY: Only fetches data when user is authenticated to prevent 401 errors
 * and maintain the safety-first architecture principle.
 *
 * Render at app layout level under SessionProvider and QueryProvider.
 */
export default function StartupInitializer() {
  const { data: session, status } = useSession()
  const setUserRole = useStore((s) => s.setUserRole)
  const setAvailableSections = useStore((s) => s.setAvailableSections)

  // Only fetch startup data when user is authenticated
  const { data } = useQuery({
    queryKey: ['startupData'],
    queryFn: () => getStartupData(),
    staleTime: 5 * 60 * 1000,
    enabled: status === 'authenticated' && !!session,
  })

  useEffect(() => {
    if (data) {
      // Map role(s) into a primary role heuristic
      const primaryRole = data.user?.roles?.[0] ?? 'readonly'
      // Normalize to our role union
      const normalizedRole = (['admin', 'standard', 'readonly'].includes(primaryRole)
        ? (primaryRole as 'admin' | 'standard' | 'readonly')
        : 'readonly')

      setUserRole(normalizedRole)

      // Transform sections to store shape
      const sections = (data.sections || []).map((s) => ({
        sectionId: String(s.sectionid),
        sectionName: s.sectionname,
        sectionType: 'explorers',
      }))
      setAvailableSections(sections)
    }
  }, [data, setUserRole, setAvailableSections])

  return null
}
