"use client";

import { useMembersLoadingState, useMembersProgress } from "@/store/use-store";

export function MembersHydrationBanner() {
  const loadingState = useMembersLoadingState();
  const progress = useMembersProgress();

  // Hide only when we have never started loading in this session.
  if (loadingState === "idle") {
    return null;
  }

  const percentage = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  const phaseLabels: Record<string, string> = {
    "loading-summary": "Loading member list…",
    "loading-individual": "Loading member details…",
    "loading-custom": "Loading contact information…",
    "error": "Error loading members",
    "complete": "Member data is up to date.",
  };

  const label = phaseLabels[loadingState] ?? "Loading members…";

  const isError = loadingState === "error";

  return (
    <div className={`border-b ${isError ? "bg-destructive/10 border-destructive" : "bg-muted/40 border-border"}`}>
      <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between gap-3 text-xs md:text-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-muted-foreground">
          <span className="font-medium text-foreground">
            Member data hydration
          </span>
          <span className={isError ? "text-destructive" : ""}>{label}</span>
        </div>
        <div className="flex items-center gap-3 min-w-[140px]">
          <div className="hidden md:block text-muted-foreground">
            {progress.completed} / {progress.total}
          </div>
          <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Member data hydration progress">
            <div
              className={`h-full ${isError ? "bg-destructive" : "bg-primary"} transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
