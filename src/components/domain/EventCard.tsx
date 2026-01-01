import Link from 'next/link'
import { CalendarRange, MapPin, Users } from 'lucide-react'
import type { RefCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { Event } from '@/lib/schemas'
import { usePrefetchEventSummary } from '@/hooks/usePrefetchEventSummary'
import { useViewportPrefetchSummary } from '@/hooks/useViewportPrefetchSummary'
import { cn } from '@/lib/utils'

interface EventCardProps {
  event: Event
}

type EventStatus = 'upcoming' | 'active' | 'past'

const statusColors: Record<EventStatus, string> = {
  upcoming: 'text-sky-600',
  active: 'text-emerald-600',
  past: 'text-slate-500',
}

const parseDate = (value?: string) => {
  if (!value) return null
  const normalized = value.includes('-')
    ? value
    : value.split('/').reverse().join('-')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const resolveStatus = (event: Event): EventStatus => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = parseDate(event.startdate_g ?? event.startdate)
  const end = parseDate(event.enddate) || start

  if (start && end) {
    if (end < today) return 'past'
    if (start > today) return 'upcoming'
    return 'active'
  }
  return 'upcoming'
}

export function EventCard({ event }: EventCardProps) {
  const prefetchSummary = usePrefetchEventSummary()
  const viewportRef = useViewportPrefetchSummary(event.eventid)
  const totalAttendance = event.yes ?? 0

  const formatDateRange = () => {
    if (!event.startdate) return 'Date TBC'
    const sameDay = event.startdate === event.enddate || !event.enddate
    return sameDay ? event.startdate : `${event.startdate} — ${event.enddate}`
  }

  const status = resolveStatus(event)
  return (
    <Link
      href={`/dashboard/events/${event.eventid}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
      prefetch
      onMouseEnter={() => prefetchSummary(event.eventid)}
      ref={viewportRef as RefCallback<HTMLAnchorElement>}
    >
      <Card className="h-full hover:bg-muted/50 transition-colors">
        <CardContent className="pt-6 h-full flex flex-col">
          <h3 className="text-lg font-semibold mb-4 line-clamp-2" title={event.name}>
            {event.name}
          </h3>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground flex-1">
            <div className="flex items-center gap-2">
              <CalendarRange className={cn('h-4 w-4', statusColors[status])} aria-hidden />
              <span className="text-foreground">{formatDateRange()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" aria-hidden />
              <span className="text-foreground">{totalAttendance} attending</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" aria-hidden />
              <span className="truncate">{event.location ?? 'Location TBC'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
