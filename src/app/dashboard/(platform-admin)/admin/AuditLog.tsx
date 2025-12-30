'use client'

import { useEffect, useState } from 'react'
import { FileText, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AuditEvent {
  timestamp: string
  userId: string
  action: string
  payload: Record<string, unknown>
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return timestamp
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatAction(action: string): string {
  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function AuditLog() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAuditLog() {
      try {
        const response = await fetch('/api/admin/audit-log')
        if (!response.ok) {
          throw new Error('Failed to fetch audit log')
        }
        const data = await response.json()
        setEvents(data.events || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuditLog()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Log
          </CardTitle>
          <CardDescription>Loading recent platform actions…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Audit Log Unavailable
          </CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit Log
        </CardTitle>
        <CardDescription>
          Recent platform configuration changes and administrative actions (last 100 events).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <Alert>
            <AlertDescription>No audit events recorded yet.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 10).map((event, index) => (
              <div
                key={`${event.timestamp}-${index}`}
                className="rounded-lg border p-3 text-sm space-y-1"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold">{formatAction(event.action)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(event.timestamp)} • User: {event.userId}
                    </p>
                  </div>
                </div>
                {Object.keys(event.payload).length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View payload
                    </summary>
                    <pre className="mt-2 rounded bg-muted p-2 overflow-x-auto">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            {events.length > 10 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                Showing 10 of {events.length} recent events
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
