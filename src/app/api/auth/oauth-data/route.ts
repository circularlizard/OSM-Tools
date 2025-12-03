import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getAuthConfig } from '@/lib/auth'
import { getOAuthData } from '@/lib/redis'

/**
 * GET /api/auth/oauth-data
 * 
 * Fetch full OAuth resource data (sections, scopes) from Redis.
 * This endpoint is used by StartupInitializer to populate the Zustand store
 * without storing large data in JWT cookies.
 */
export async function GET() {
  try {
    const session = await getServerSession(getAuthConfig())
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid session', message: 'User ID not found in session' },
        { status: 400 }
      )
    }

    // Fetch OAuth data from Redis
    const oauthData = await getOAuthData(userId)
    
    if (!oauthData) {
      return NextResponse.json(
        { error: 'Not found', message: 'OAuth data not found in cache' },
        { status: 404 }
      )
    }

    return NextResponse.json(oauthData)
  } catch (error) {
    console.error('[OAuth Data] Error fetching OAuth data:', error)
    return NextResponse.json(
      { error: 'Internal error', message: 'Failed to fetch OAuth data' },
      { status: 500 }
    )
  }
}
