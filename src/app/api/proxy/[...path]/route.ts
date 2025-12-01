import { NextRequest, NextResponse } from 'next/server'
import { scheduleRequest, parseRateLimitHeaders } from '@/lib/bottleneck'
import {
  isHardLocked,
  isSoftLocked,
  setHardLock,
  getCachedResponse,
  setCachedResponse,
  getCacheKey,
} from '@/lib/redis'
import { logProxyRequest, logCache } from '@/lib/logger'

/**
 * Proxy API Route
 * 
 * The "Safety Shield" - All OSM API requests must go through here.
 * 
 * Features:
 * - Rate limiting (Bottleneck)
 * - Circuit breaker (Redis locks)
 * - Read-through caching
 * - Request validation
 * - Read-only enforcement (blocks POST/PUT/DELETE)
 * 
 * Route: /api/proxy/[...path]
 * Example: /api/proxy/ext/members/contact/?action=getListOfMembers&sectionid=37458
 */

const OSM_API_BASE = process.env.OSM_API_URL || 'https://www.onlinescoutmanager.co.uk'
const OSM_API_TOKEN = process.env.OSM_API_TOKEN

// Cache TTL (5 minutes)
const CACHE_TTL = 300

/**
 * GET Handler - Fetch data from OSM API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const startTime = Date.now()
  let resolvedParams: { path: string[] } | null = null
  try {
    resolvedParams = await params
    // Check for hard lock (global halt)
    if (await isHardLocked()) {
      return NextResponse.json(
        {
          error: 'SYSTEM_HALTED',
          message:
            'System is temporarily unavailable due to API blocking. Please contact administrator.',
          retryAfter: 300,
        },
        { status: 503 }
      )
    }

    // Check for soft lock (cooldown period)
    if (await isSoftLocked()) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: 'System is cooling down. Please try again in a moment.',
          retryAfter: 60,
        },
        { status: 429 }
      )
    }

    // Validate API token is configured
    if (!OSM_API_TOKEN) {
      console.error('[Proxy] OSM_API_TOKEN not configured')
      return NextResponse.json(
        {
          error: 'CONFIGURATION_ERROR',
          message: 'API token not configured',
        },
        { status: 500 }
      )
    }

    // Build target URL
    const path = resolvedParams.path.join('/')
    const searchParams = request.nextUrl.searchParams.toString()
    const targetUrl = `${OSM_API_BASE}/${path}${searchParams ? `?${searchParams}` : ''}`
    

    // Check cache first (read-through pattern)
    const cacheKey = getCacheKey(path, Object.fromEntries(request.nextUrl.searchParams))
    const cachedData = await getCachedResponse(cacheKey)

    if (cachedData) {
      logCache({ operation: 'hit', key: cacheKey })
      logProxyRequest({
        method: 'GET',
        path,
        status: 200,
        duration: Date.now() - startTime,
        cached: true,
      })
      return NextResponse.json(JSON.parse(cachedData), {
        status: 200,
        headers: {
          'X-Cache': 'HIT',
        },
      })
    }

    logCache({ operation: 'miss', key: cacheKey })

    // Schedule request through rate limiter
    const response = await scheduleRequest(async () => {
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${OSM_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      return res
    })

    // Parse rate limit headers
    await parseRateLimitHeaders(response.headers)

    // Check for API blocking (X-Blocked header)
    const blocked = response.headers.get('X-Blocked')
    if (blocked) {
      console.error('[Proxy] API returned X-Blocked header - triggering hard lock')
      await setHardLock(300) // 5 minutes
      return NextResponse.json(
        {
          error: 'API_BLOCKED',
          message: 'API access has been blocked. System halted for 5 minutes.',
          retryAfter: 300,
        },
        { status: 503 }
      )
    }

    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Proxy] API error: ${response.status} - ${errorText}`)
      return NextResponse.json(
        {
          error: 'API_ERROR',
          message: `OSM API returned ${response.status}`,
          details: errorText,
        },
        { status: response.status }
      )
    }

    // Parse and cache successful response
    const data = await response.json()
    await setCachedResponse(cacheKey, JSON.stringify(data), CACHE_TTL)
    logCache({ operation: 'set', key: cacheKey, ttl: CACHE_TTL })

    logProxyRequest({
      method: 'GET',
      path,
      status: 200,
      duration: Date.now() - startTime,
      cached: false,
    })

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'X-Cache': 'MISS',
        'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining') || '',
        'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit') || '',
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const pathFromUrl = resolvedParams ? resolvedParams.path.join('/') : request.nextUrl.pathname.replace(/^\/?api\/proxy\//, '')

    if (error instanceof Error && error.message.includes('RATE_LIMITED')) {
      logProxyRequest({ method: 'GET', path: pathFromUrl, status: 429, duration, error: errorMessage })
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: error.message, retryAfter: 60 },
        { status: 429 }
      )
    }

    logProxyRequest({ method: 'GET', path: pathFromUrl, status: 500, duration, error: errorMessage })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST/PUT/DELETE Handlers - Blocked (Read-Only Policy)
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'METHOD_NOT_ALLOWED',
      message: 'This application is read-only. POST requests are not permitted.',
    },
    { status: 403 }
  )
}

export async function PUT() {
  return NextResponse.json(
    {
      error: 'METHOD_NOT_ALLOWED',
      message: 'This application is read-only. PUT requests are not permitted.',
    },
    { status: 403 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'METHOD_NOT_ALLOWED',
      message: 'This application is read-only. DELETE requests are not permitted.',
    },
    { status: 403 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'METHOD_NOT_ALLOWED',
      message: 'This application is read-only. PATCH requests are not permitted.',
    },
    { status: 403 }
  )
}
