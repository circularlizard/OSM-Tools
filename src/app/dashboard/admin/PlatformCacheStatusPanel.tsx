'use client'

import { AlertCircle, Database } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlatformCacheStatus } from '@/hooks/usePlatformCacheStatus'

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) return 'Never'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PlatformCacheStatusPanel() {
  const { data, isLoading, isError, error } = usePlatformCacheStatus()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Platform caches
          </CardTitle>
          <CardDescription>Loading cache status…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Cache status unavailable
          </CardTitle>
          <CardDescription className="text-destructive">
            {error instanceof Error ? error.message : 'Failed to load cache telemetry'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Platform caches
        </CardTitle>
        <CardDescription>
          Snapshot of Redis-backed caches that underpin the multi-app platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase text-muted-foreground font-semibold">Patrol cache</p>
          <p className="text-sm mt-1 text-muted-foreground">
            Last updated: <span className="font-medium text-foreground">{formatTimestamp(data.patrols.lastUpdated)}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase">Sections cached</p>
              <p className="text-xl font-semibold">
                {data.patrols.sectionsCached ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Patrol count</p>
              <p className="text-xl font-semibold">
                {data.patrols.patrolCount ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Updated by</p>
              <p className="text-sm font-medium">{data.patrols.updatedBy ?? '—'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase text-muted-foreground font-semibold">Members cache</p>
          <p className="text-sm mt-1 text-muted-foreground">
            Last updated: <span className="font-medium text-foreground">{formatTimestamp(data.members.lastUpdated)}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase">Total members</p>
              <p className="text-xl font-semibold">
                {data.members.total ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Status</p>
              <p className="text-sm font-medium">
                {data.members.lastUpdated ? 'Healthy' : 'Pending instrumentation'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
