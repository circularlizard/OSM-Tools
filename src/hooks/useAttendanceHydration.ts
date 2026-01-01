import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useEvents } from './useEvents'
import { usePrefetchEventSummary } from './usePrefetchEventSummary'

/**
 * Hydrates event summaries for the attendance view.
 * Automatically prefetches summaries for all events when mounted.
 * Uses a queue to avoid overwhelming the API.
 */
export function useAttendanceHydration() {
  const { events, isLoading: eventsLoading } = useEvents()
  const prefetchSummary = usePrefetchEventSummary()
  const hydratingRef = useRef(false)
  const hydratedIdsRef = useRef<Set<number>>(new Set())
  const failedIdsRef = useRef<Set<number>>(new Set())
  const processedIdsRef = useRef<Set<number>>(new Set())
  const [retryToken, setRetryToken] = useState(0)
  const [statsSnapshot, setStatsSnapshot] = useState({
    hydrated: 0,
    failed: 0,
    processed: 0,
  })

  const emitStatsSnapshot = useCallback(() => {
    setStatsSnapshot({
      hydrated: hydratedIdsRef.current.size,
      failed: failedIdsRef.current.size,
      processed: processedIdsRef.current.size,
    })
  }, [])

  const uniqueEventIds = useMemo(() => {
    const ids = events.map((e) => Number(e.eventid)).filter((id): id is number => Boolean(id))
    return Array.from(new Set(ids))
  }, [events])

  useEffect(() => {
    if (eventsLoading || uniqueEventIds.length === 0 || hydratingRef.current) {
      return
    }

    const eventIds = uniqueEventIds.filter((id) => !processedIdsRef.current.has(id))

    if (eventIds.length === 0) {
      return
    }

    hydratingRef.current = true
    emitStatsSnapshot()

    const hydrate = async () => {
      for (const eventId of eventIds) {
        try {
          await prefetchSummary(eventId)
          hydratedIdsRef.current.add(eventId)
          failedIdsRef.current.delete(eventId)
        } catch (error) {
          console.error(`Failed to prefetch summary for event ${eventId}:`, error)
          failedIdsRef.current.add(eventId)
        } finally {
          processedIdsRef.current.add(eventId)
          emitStatsSnapshot()
        }
      }
      hydratingRef.current = false
      emitStatsSnapshot()
    }

    void hydrate()
  }, [emitStatsSnapshot, eventsLoading, prefetchSummary, retryToken, uniqueEventIds])

  const totalEvents = uniqueEventIds.length
  const processedCount = statsSnapshot.processed
  const isHydrating = !eventsLoading && totalEvents > 0 && processedCount < totalEvents

  const retryFailed = () => {
    if (failedIdsRef.current.size === 0) {
      return
    }
    failedIdsRef.current.forEach((id) => {
      processedIdsRef.current.delete(id)
    })
    emitStatsSnapshot()
    setRetryToken((token) => token + 1)
  }

  return {
    isHydrating,
    hydratedCount: statsSnapshot.hydrated,
    failedCount: statsSnapshot.failed,
    processedCount,
    totalEvents,
    retryFailed,
  }
}
