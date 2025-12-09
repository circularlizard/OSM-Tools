import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { getStartupData, getPatrols } from '@/lib/api'

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
 * Term data structure from startup data
 */
interface TermData {
  termid: string
  sectionid: string
  name: string
  startdate: string
  enddate: string
}

/**
 * Find the current term for a section from startup data
 */
function findCurrentTermId(
  terms: Record<string, TermData[]> | undefined,
  sectionId: string
): string | null {
  if (!terms) return null
  
  const sectionTerms = terms[sectionId]
  if (!sectionTerms || sectionTerms.length === 0) {
    return null
  }

  const today = new Date().toISOString().split('T')[0]
  
  // Find term that contains today
  const currentTerm = sectionTerms.find(
    (t) => t.startdate <= today && t.enddate >= today
  )
  if (currentTerm) {
    return currentTerm.termid
  }

  // Fallback: find the most recent term (by end date)
  const sorted = [...sectionTerms].sort((a, b) => 
    b.enddate.localeCompare(a.enddate)
  )
  return sorted[0]?.termid || null
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
 * Refresh patrol data (admin only)
 * 1. Fetches startup data to get section info and term IDs
 * 2. Fetches patrols for each section via the proxy
 * 3. Sends the collected data to the server to cache in Redis
 */
async function refreshPatrols(): Promise<RefreshResponse> {
  const errors: string[] = []
  
  // Step 1: Get startup data to find sections and terms
  const startupData = await getStartupData()
  if (!startupData) {
    throw new Error('Failed to fetch startup data')
  }

  // Build section info from startup data
  const terms = startupData.terms as Record<string, TermData[]> | undefined
  const roles = startupData.globals.roles
  
  // Step 2: Fetch patrols for each section
  const allPatrols: CachedPatrol[] = []
  
  for (const role of roles) {
    const sectionId = role.sectionid
    const termId = findCurrentTermId(terms, sectionId)
    
    if (!termId) {
      errors.push(`Section ${role.sectionname}: No term data available`)
      continue
    }
    
    try {
      const patrolsResponse = await getPatrols({
        sectionid: parseInt(sectionId, 10),
        termid: parseInt(termId, 10),
        section: role.section || 'explorers',
      })

      const cachedPatrols: CachedPatrol[] = patrolsResponse.patrols.map((p) => ({
        patrolId: p.patrolid,
        patrolName: p.name,
        sectionId,
        sectionName: role.sectionname,
        memberCount: 0,
      }))

      allPatrols.push(...cachedPatrols)
    } catch (error) {
      console.error(`Failed to fetch patrols for section ${sectionId}:`, error)
      errors.push(`Section ${role.sectionname}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Step 3: Send to server to cache in Redis
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
 */
export function usePatrolRefresh() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: refreshPatrols,
    onSuccess: (data) => {
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
