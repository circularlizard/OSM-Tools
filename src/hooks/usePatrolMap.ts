import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { getPatrols } from '@/lib/api'
import { useStore, type Section } from '@/store/use-store'

/**
 * Cached patrol data from the server
 */
export interface CachedPatrol {
  patrolId: number
  patrolName: string
  sectionId: string
  sectionName: string
  memberCount: number
}

export interface PatrolCacheMeta {
  lastUpdated: string
  updatedBy: string
  sectionCount: number
  patrolCount: number
}

interface PatrolsResponse {
  meta: PatrolCacheMeta | null
  patrols: CachedPatrol[]
  errors?: string[]
}

interface RefreshResponse extends PatrolsResponse {
  success: boolean
}

/**
 * Fetch patrol data from the API cache
 */
async function fetchPatrols(): Promise<PatrolsResponse> {
  const response = await fetch('/api/admin/patrols')
  if (!response.ok) {
    throw new Error('Failed to fetch patrol data')
  }
  return response.json()
}

/**
 * Refresh patrol data for given sections
 * 1. Fetches patrols for each section via the proxy
 * 2. Sends the collected data to the server to cache in Redis
 */
async function refreshPatrolsForSections(sections: Section[]): Promise<RefreshResponse> {
  const errors: string[] = []
  const allPatrols: CachedPatrol[] = []
  
  for (const section of sections) {
    const termId = section.termId || '0'
    
    if (termId === '0') {
      errors.push(`Section ${section.sectionName}: No term ID available`)
      continue
    }
    
    try {
      const patrolsResponse = await getPatrols({
        sectionid: parseInt(section.sectionId, 10),
        termid: parseInt(termId, 10),
        section: section.sectionType || 'explorers',
      })

      const cachedPatrols: CachedPatrol[] = patrolsResponse.patrols.map((p) => ({
        patrolId: p.patrolid,
        patrolName: p.name,
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        memberCount: 0,
      }))

      allPatrols.push(...cachedPatrols)
    } catch (error) {
      console.error(`Failed to fetch patrols for section ${section.sectionId}:`, error)
      errors.push(`Section ${section.sectionName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Send to server to cache in Redis
  const response = await fetch('/api/admin/patrols', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patrols: allPatrols }),
  })
  
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to store patrol data')
  }
  
  const result = await response.json() as RefreshResponse
  
  // Add any fetch errors to the response
  if (errors.length > 0) {
    result.errors = [...(result.errors || []), ...errors]
  }
  
  return result
}

/**
 * Hook to access patrol data and name mapping
 * 
 * Returns:
 * - patrols: Array of all cached patrols
 * - meta: Cache metadata (last updated, etc.)
 * - getPatrolName: Function to get patrol name by ID (with fallback)
 * - isLoading: Loading state
 * - error: Error state
 */
export function usePatrolMap() {
  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'

  const { data, isLoading, error } = useQuery({
    queryKey: ['patrols'],
    queryFn: fetchPatrols,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  /**
   * Get patrol name by ID, with fallback to ID string
   * @param patrolId Patrol ID (number or string)
   * @returns Patrol name or ID string if not found
   */
  const getPatrolName = (patrolId: number | string | null | undefined): string => {
    if (patrolId === null || patrolId === undefined) {
      return 'Unassigned'
    }
    
    const id = typeof patrolId === 'string' ? parseInt(patrolId, 10) : patrolId
    
    if (isNaN(id)) {
      // If it's already a name string, return it
      return String(patrolId)
    }
    
    const patrol = data?.patrols.find((p) => p.patrolId === id)
    return patrol?.patrolName || String(patrolId)
  }

  return {
    patrols: data?.patrols ?? [],
    meta: data?.meta ?? null,
    getPatrolName,
    isLoading,
    error,
  }
}

/**
 * Hook for admin patrol refresh functionality
 * Uses availableSections from the store to get section info and term IDs
 */
export function usePatrolRefresh() {
  const queryClient = useQueryClient()
  const availableSections = useStore((state) => state.availableSections)

  const mutation = useMutation({
    mutationFn: async () => {
      if (availableSections.length === 0) {
        throw new Error('No sections available')
      }
      return refreshPatrolsForSections(availableSections)
    },
    onSuccess: (data: RefreshResponse) => {
      // Update the cache with fresh data
      queryClient.setQueryData(['patrols'], {
        meta: data.meta,
        patrols: data.patrols,
      })
    },
  })

  return {
    refresh: mutation.mutate,
    isRefreshing: mutation.isPending,
    error: mutation.error,
    lastResult: mutation.data,
  }
}
