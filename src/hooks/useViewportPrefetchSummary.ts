import { useEffect, useRef } from 'react'
import { usePrefetchEventSummary } from './usePrefetchEventSummary'

/**
 * Use IntersectionObserver to prefetch event summary when an element
 * enters the viewport. Returns a ref callback to attach to the target element.
 */
export function useViewportPrefetchSummary(eventId: string | number) {
  const prefetch = usePrefetchEventSummary()
  const observedRef = useRef<Element | null>(null)

  useEffect(() => {
    const el = observedRef.current
    if (!el) return
    const id = Number(eventId)
    if (!id) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetch(id)
            observer.disconnect()
          }
        })
      },
      { root: null, rootMargin: '0px', threshold: 0.25 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [eventId, prefetch])

  return (node: Element | null) => {
    observedRef.current = node
  }
}
