import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getAuthConfig } from '@/lib/auth'
import { getRedisClient } from '@/lib/redis'

/**
 * GET /api/admin/platform-config
 * Fetch platform configuration from Redis
 */
export async function GET() {
  try {
    const authOptions = await getAuthConfig()
    const session = await getServerSession(authOptions)
    const role = (session as { roleSelection?: string } | null)?.roleSelection

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const redis = await getRedisClient()
    const seeeSectionId = await redis.get('platform:seeeSectionId')
    const allowedOperators = await redis.get('platform:allowedOperators')

    return NextResponse.json({
      seeeSectionId: seeeSectionId || '43105',
      allowedOperators: allowedOperators ? JSON.parse(allowedOperators) : [],
    })
  } catch (error) {
    console.error('[Platform Config API] Error fetching config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform configuration' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/platform-config
 * Update platform configuration in Redis
 */
export async function POST(request: NextRequest) {
  try {
    const authOptions = await getAuthConfig()
    const session = await getServerSession(authOptions)
    const role = (session as { roleSelection?: string } | null)?.roleSelection
    const userId = session?.user && 'id' in session.user ? (session.user as { id: string }).id : 'unknown'

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { seeeSectionId, allowedOperators } = body

    const redis = await getRedisClient()

    // Update SEEE section ID if provided
    if (seeeSectionId !== undefined) {
      await redis.set('platform:seeeSectionId', String(seeeSectionId))
      
      // Log audit event
      const auditEvent = {
        timestamp: new Date().toISOString(),
        userId,
        action: 'update_seee_section_id',
        payload: { seeeSectionId },
      }
      await redis.lpush('platform:audit', JSON.stringify(auditEvent))
      await redis.ltrim('platform:audit', 0, 99) // Keep last 100 events
    }

    // Update allowed operators if provided
    if (allowedOperators !== undefined) {
      await redis.set('platform:allowedOperators', JSON.stringify(allowedOperators))
      
      // Log audit event
      const auditEvent = {
        timestamp: new Date().toISOString(),
        userId,
        action: 'update_allowed_operators',
        payload: { allowedOperators },
      }
      await redis.lpush('platform:audit', JSON.stringify(auditEvent))
      await redis.ltrim('platform:audit', 0, 99)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Platform Config API] Error updating config:', error)
    return NextResponse.json(
      { error: 'Failed to update platform configuration' },
      { status: 500 }
    )
  }
}
