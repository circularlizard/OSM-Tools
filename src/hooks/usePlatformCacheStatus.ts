'use client'

import { useQuery } from '@tanstack/react-query'
import { PlatformCacheStatusSchema, type PlatformCacheStatus } from '@/lib/schemas'

async function fetchPlatformCacheStatus(): Promise<PlatformCacheStatus> {
  const response = await fetch('/api/platform/cache-status', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch platform cache status (${response.status})`)
  }

  const data = (await response.json()) as unknown
  return PlatformCacheStatusSchema.parse(data)
}

export function usePlatformCacheStatus() {
  const pollingMs = Number(process.env.NEXT_PUBLIC_PLATFORM_CACHE_POLL_MS || '60000')

  return useQuery({
    queryKey: ['platform-cache-status'],
    queryFn: fetchPlatformCacheStatus,
    refetchInterval: Number.isFinite(pollingMs) ? pollingMs : 60000,
    refetchIntervalInBackground: true,
    staleTime: 10000,
    retry: 1,
  })
}
