import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

/**
 * Accessor for cached event summaries hydrated via prefetch/queue.
 * Returns a getter to read summary by event id without triggering a fetch.
 */
export function useEventSummaryCache() {
  const qc = useQueryClient()
  const getSummaryById = useCallback(
    (eventId: number) => qc.getQueryData<any>(['event-summary', eventId]) ?? null,
    [qc]
  )
  return { getSummaryById }
}
