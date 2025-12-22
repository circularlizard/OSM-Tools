import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getAuthConfig } from '@/lib/auth'
import { getPatrolCacheMeta } from '@/lib/redis'

export async function GET() {
  const authOptions = await getAuthConfig()
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = (session as { roleSelection?: string } | null)?.roleSelection
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const patrolMeta = await getPatrolCacheMeta()

    return NextResponse.json({
      patrols: {
        lastUpdated: patrolMeta?.lastUpdated ?? null,
        sectionsCached: patrolMeta?.sectionCount ?? null,
        patrolCount: patrolMeta?.patrolCount ?? null,
        updatedBy: patrolMeta?.updatedBy ?? null,
      },
      members: {
        lastUpdated: null,
        total: null,
      },
    })
  } catch (error) {
    console.error('[Platform Cache Status] Failed to load cache metadata', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
