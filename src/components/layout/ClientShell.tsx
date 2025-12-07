"use client";
import { useSession } from "next-auth/react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import SummaryQueueBanner from "./SummaryQueueBanner";
import { useEvents } from "@/hooks/useEvents";
import { useEffect } from "react";
import { useEventSummaryQueue } from "@/hooks/useEventSummaryQueue";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const { data } = useEvents();
  const { enqueue } = useEventSummaryQueue({ concurrency: 2, delayMs: 800, retryBackoffMs: 5000 });
  useEffect(() => {
    const items = data?.items ?? [];
    if (items.length) {
      enqueue(items.map((e: any) => e.eventid));
    }
  }, [data, enqueue]);
  // Only render the full application chrome when authenticated.
  // Hide during loading state to prevent flash of navigation on login page
  if (status === "loading" || status === "unauthenticated") {
    return <main className="min-h-screen">{children}</main>;
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SummaryQueueBanner />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
