import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getAuthConfig } from '@/lib/auth'
import { loadConfig } from '@/lib/config-loader'

/**
 * GET /api/config/access
 * Returns access control strategy and allowed IDs for the current user.
 * For now, returns a placeholder mapping based on global config.
 */
export async function GET() {
  try {
    const session = await getServerSession(getAuthConfig())
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load global config to choose strategy defaults
    const appConfig = await loadConfig()

    const role = (session.user as any).roleSelection || 'readonly'
    const roleConfig = appConfig.userRoles[role] || { accessStrategy: 'all' }

    // Map roleConfig.accessStrategy to our store strategies
    // 'patrol_or_event' -> prefer Strategy A by default; Admin -> bypass
    const accessControlStrategy: 'A' | 'B' = roleConfig.accessStrategy === 'patrol_or_event' ? 'A' : 'A'

    // Placeholder: allowed IDs empty; Admin bypass handled client-side
    const allowedPatrolIds: string[] = []
    const allowedEventIds: string[] = []

    return NextResponse.json({ accessControlStrategy, allowedPatrolIds, allowedEventIds })
  } catch (error) {
    console.error('[Config Access] Failed to load access config', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}