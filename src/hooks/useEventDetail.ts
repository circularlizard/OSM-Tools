import { useQuery } from '@tanstack/react-query'
import { getEventDetails, getEventSummary } from '@/lib/api'
import { useStore } from '@/store/use-store'

interface EventDetailData {
  details: unknown
  summary: unknown
}

export function useEventDetail(eventId: number) {
  const currentSection = useStore((state) => state.currentSection)

  return useQuery<EventDetailData>({
    queryKey: ['event-detail', eventId, currentSection?.termId],
    queryFn: async ({ signal }) => {
      const [details, summary] = await Promise.all([
        getEventDetails(eventId, signal),
        getEventSummary(eventId, signal),
      ])

      return { details, summary }
    },
    enabled: !!eventId,
  })
}
