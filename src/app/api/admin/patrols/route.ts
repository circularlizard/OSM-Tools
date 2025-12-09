import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getAuthConfig } from '@/lib/auth'
import { getPatrols, getStartupData } from '@/lib/api'
import {
  setPatrolCache,
  setPatrolCacheMeta,
  getPatrolCacheMeta,
  getAllPatrolCaches,
  type CachedPatrol,
  type PatrolCacheMeta,
} from '@/lib/redis'
import { getOAuthData } from '@/lib/redis'

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
 * Returns the term that contains today's date, or the most recent term
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
 * GET /api/admin/patrols
 * Get cached patrol data and metadata
 * Accessible to all authenticated users (read-only)
 */
export async function GET() {
  const authOptions = await getAuthConfig()
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const meta = await getPatrolCacheMeta()
    const caches = await getAllPatrolCaches()
    
    // Flatten all patrols from all sections
    const allPatrols: CachedPatrol[] = []
    for (const patrols of caches.values()) {
      allPatrols.push(...patrols)
    }

    return NextResponse.json({
      meta,
      patrols: allPatrols,
    })
  } catch (error) {
    console.error('Failed to get patrol cache:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve patrol data' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/patrols
 * Refresh patrol data from OSM API
 * Admin only - fetches fresh patrol data for all accessible sections
 */
export async function POST(request: NextRequest) {
  const authOptions = await getAuthConfig()
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin role
  const role = (session as { roleSelection?: string })?.roleSelection
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }

  try {
    // Get user's accessible sections from OAuth data
    const userId = (session.user as { id?: string })?.id
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 })
    }

    const oauthData = await getOAuthData(userId)
    if (!oauthData?.sections || oauthData.sections.length === 0) {
      return NextResponse.json({ error: 'No sections available' }, { status: 400 })
    }

    // Get startup data to find term IDs and section types
    const startupData = await getStartupData()
    if (!startupData) {
      return NextResponse.json({ error: 'Failed to fetch startup data' }, { status: 500 })
    }

    // Build a map of sectionId -> { termId, sectionType } from startup data roles
    // Cast terms since the schema uses passthrough() and doesn't type this field
    const terms = startupData.terms as Record<string, TermData[]> | undefined
    const sectionInfo = new Map<string, { termId: string; sectionType: string; sectionName: string }>()
    for (const role of startupData.globals.roles) {
      const sectionId = role.sectionid
      const termId = findCurrentTermId(terms, sectionId)
      if (termId) {
        sectionInfo.set(sectionId, {
          termId,
          sectionType: role.section || 'explorers',
          sectionName: role.sectionname || `Section ${sectionId}`,
        })
      }
    }

    const allPatrols: CachedPatrol[] = []
    const errors: string[] = []

    // Fetch patrol data for each section
    for (const section of oauthData.sections) {
      const sectionId = section.section_id.toString()
      const info = sectionInfo.get(sectionId)
      
      if (!info) {
        errors.push(`Section ${sectionId}: No term data available`)
        continue
      }
      
      try {
        const patrolsResponse = await getPatrols({
          sectionid: section.section_id,
          termid: parseInt(info.termId, 10),
          section: info.sectionType,
        })

        const cachedPatrols: CachedPatrol[] = patrolsResponse.patrols.map((p) => ({
          patrolId: p.patrolid,
          patrolName: p.name,
          sectionId,
          sectionName: info.sectionName,
          memberCount: 0, // OSM doesn't return member count in patrol list
        }))

        // Store in cache
        await setPatrolCache(sectionId, cachedPatrols)
        allPatrols.push(...cachedPatrols)
      } catch (error) {
        console.error(`Failed to fetch patrols for section ${sectionId}:`, error)
        errors.push(`Section ${info.sectionName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Update metadata
    const meta: PatrolCacheMeta = {
      lastUpdated: new Date().toISOString(),
      updatedBy: session.user.name || userId,
      sectionCount: oauthData.sections.length,
      patrolCount: allPatrols.length,
    }
    await setPatrolCacheMeta(meta)

    return NextResponse.json({
      success: true,
      meta,
      patrols: allPatrols,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Failed to refresh patrol data:', error)
    return NextResponse.json(
      { error: 'Failed to refresh patrol data' },
      { status: 500 }
    )
  }
}
