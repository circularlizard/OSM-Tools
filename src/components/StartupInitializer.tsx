'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getStartupData } from '@/lib/api'
import { useStore } from '@/store/use-store'

/**
 * StartupInitializer
 *
 * Client component that fetches startup data on mount and
 * populates the Zustand store with user role and available sections.
 *
 * Render at app layout level under QueryProvider so it's available globally.
 */
export default function StartupInitializer() {
  const setUserRole = useStore((s) => s.setUserRole)
  const setAvailableSections = useStore((s) => s.setAvailableSections)

  const { data } = useQuery({
    queryKey: ['startupData'],
    queryFn: () => getStartupData(),
    staleTime: 5 * 60 * 1000,
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
