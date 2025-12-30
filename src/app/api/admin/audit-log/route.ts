import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getAuthConfig } from '@/lib/auth'
import { getRedisClient } from '@/lib/redis'

/**
 * GET /api/admin/audit-log
 * Fetch recent audit events from Redis
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
    
    // Fetch last 100 audit events from Redis list
    const rawEvents = await redis.lrange('platform:audit', 0, 99)
    
    const events = rawEvents.map((event) => {
      try {
        return JSON.parse(event)
      } catch {
        return null
      }
    }).filter(Boolean)

    return NextResponse.json({ events })
  } catch (error) {
    console.error('[Audit Log API] Error fetching audit log:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    )
  }
}
