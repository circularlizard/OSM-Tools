import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getAuthConfig } from '@/lib/auth'
import {
  setPatrolCache,
  setPatrolCacheMeta,
  getPatrolCacheMeta,
  getAllPatrolCaches,
  type CachedPatrol,
  type PatrolCacheMeta,
} from '@/lib/redis'

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
 * Store patrol data in Redis cache
 * Admin only - receives patrol data from client and caches it
 * 
 * Request body: {
 *   patrols: CachedPatrol[]
 * }
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
    const body = await request.json()
    const patrols = body.patrols as CachedPatrol[]
    
    if (!patrols || !Array.isArray(patrols)) {
      return NextResponse.json({ error: 'Invalid request body - patrols array required' }, { status: 400 })
    }

    // Group patrols by section and store each group
    const patrolsBySection = new Map<string, CachedPatrol[]>()
    for (const patrol of patrols) {
      const existing = patrolsBySection.get(patrol.sectionId) || []
      existing.push(patrol)
      patrolsBySection.set(patrol.sectionId, existing)
    }

    // Store each section's patrols in cache
    for (const [sectionId, sectionPatrols] of patrolsBySection) {
      await setPatrolCache(sectionId, sectionPatrols)
    }

    // Update metadata
    const userId = (session.user as { id?: string })?.id || 'unknown'
    const meta: PatrolCacheMeta = {
      lastUpdated: new Date().toISOString(),
      updatedBy: session.user.name || userId,
      sectionCount: patrolsBySection.size,
      patrolCount: patrols.length,
    }
    await setPatrolCacheMeta(meta)

    return NextResponse.json({
      success: true,
      meta,
      patrols,
    })
  } catch (error) {
    console.error('Failed to store patrol data:', error)
    return NextResponse.json(
      { error: 'Failed to store patrol data' },
      { status: 500 }
    )
  }
}
