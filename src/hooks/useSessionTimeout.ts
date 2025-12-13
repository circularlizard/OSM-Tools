"use client";

import { useEffect, useRef } from "react";
import { useSession, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes

interface TimeoutRefs {
  lastActive: number;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

/**
 * useSessionTimeout
 *
 * Client-side inactivity watcher that:
 * - Tracks user activity events (mouse, keyboard, focus, visibility)
 * - After 15 minutes of inactivity, re-checks the session
 * - Redirects to login if the session has expired
 */
export function useSessionTimeout() {
  const { status } = useSession();
  const router = useRouter();
  const refs = useRef<TimeoutRefs>({ lastActive: Date.now(), timeoutId: null });

  useEffect(() => {
    if (status !== "authenticated") {
      // If the user is not authenticated, do not start inactivity tracking.
      // Any existing timeout is cleared.
      if (refs.current.timeoutId) {
        clearTimeout(refs.current.timeoutId);
        refs.current.timeoutId = null;
      }
      return;
    }

    const updateLastActive = () => {
      refs.current.lastActive = Date.now();
      if (refs.current.timeoutId) {
        clearTimeout(refs.current.timeoutId);
      }
      refs.current.timeoutId = setTimeout(checkInactivity, INACTIVITY_MS);
    };

    const checkInactivity = async () => {
      const now = Date.now();
      const idleFor = now - refs.current.lastActive;
      if (idleFor < INACTIVITY_MS) {
        // User became active again; schedule next check from now.
        refs.current.timeoutId = setTimeout(checkInactivity, INACTIVITY_MS - idleFor);
        return;
      }

      try {
        const session = await getSession();
        if (!session) {
          // Session has expired; redirect to login with callback to current location.
          if (typeof window !== "undefined") {
            const callbackUrl = window.location.pathname + window.location.search;
            router.push(`/?callbackUrl=${encodeURIComponent(callbackUrl)}`);
          }
          return;
        }
        // Session is still valid; schedule next inactivity check.
        refs.current.lastActive = Date.now();
        refs.current.timeoutId = setTimeout(checkInactivity, INACTIVITY_MS);
      } catch {
        // On error, fail softly by scheduling another check.
        refs.current.timeoutId = setTimeout(checkInactivity, INACTIVITY_MS);
      }
    };

    // Activity events that should reset the inactivity timer
    const activityEvents: (keyof DocumentEventMap)[] = [
      "mousemove",
      "keydown",
      "click",
      "focus",
      "visibilitychange",
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, updateLastActive, { passive: true } as EventListenerOptions);
    });

    // Start the initial timer from now
    updateLastActive();

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateLastActive as EventListener);
      });
      if (refs.current.timeoutId) {
        clearTimeout(refs.current.timeoutId);
        refs.current.timeoutId = null;
      }
    };
  }, [status, router]);
}
