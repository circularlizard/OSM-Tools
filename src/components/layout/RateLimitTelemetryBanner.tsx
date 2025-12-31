"use client";

import { useMemo } from 'react'
import { useRateLimitTelemetry } from '@/hooks/useRateLimitTelemetry'

function formatTtl(ttlSeconds: number | null | undefined): string | null {
  if (ttlSeconds === null || ttlSeconds === undefined) return null
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) return null

  const total = Math.floor(ttlSeconds)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

export function RateLimitTelemetryBanner() {
  const { data, isError } = useRateLimitTelemetry()

  const view = useMemo(() => {
    if (!data) return null

    if (data.hardLocked) {
      const ttl = formatTtl(data.hardLockTtlSeconds)
      return {
        variant: 'error' as const,
        title: 'API Blocked',
        message: `Requests are temporarily halted due to upstream blocking.${ttl ? ` (${ttl} remaining)` : ''}`,
      }
    }

    if (data.softLocked) {
      const ttl = formatTtl(data.softLockTtlSeconds)
      return {
        variant: 'warn' as const,
        title: 'Cooling Down',
        message: `Requests are paused briefly to protect the upstream API.${ttl ? ` (${ttl} remaining)` : ''}`,
      }
    }

    if (data.quota && data.quota.limit > 0) {
      const percentUsed = ((data.quota.limit - data.quota.remaining) / data.quota.limit) * 100
      if (percentUsed >= 80) {
        return {
          variant: 'warn' as const,
          title: 'Rate Limit High',
          message: `Upstream quota is ${Math.round(percentUsed)}% used (${data.quota.remaining}/${data.quota.limit} remaining).`,
        }
      }
    }

    return null
  }, [data])

  if (isError) {
    return null
  }

  if (!view) {
    return null
  }

  const className =
    view.variant === 'error'
      ? 'bg-destructive/10 border-destructive text-destructive'
      : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'

  return (
    <div className={`border-b ${className}`}>
      <div className="px-4 py-2 text-xs md:text-sm">
        <span className="font-semibold">{view.title}</span>
        <span className="ml-2">{view.message}</span>
      </div>
    </div>
  )
}
