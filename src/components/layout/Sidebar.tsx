"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRateLimitTelemetry } from "@/hooks/useRateLimitTelemetry";
import { cn } from "@/lib/utils";
import { useNavigationMenu } from "./use-navigation";

function formatDuration(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined) return null;
  if (!Number.isFinite(seconds) || seconds <= 0) return null;

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    const minsPart = minutes > 0 ? ` ${minutes}m` : "";
    return `${hours}h${minsPart}${remainingSeconds > 0 ? ` ${remainingSeconds}s` : ""}`.trim();
  }

  if (minutes > 0) {
    return `${minutes}m${remainingSeconds > 0 ? ` ${remainingSeconds}s` : ""}`;
  }

  return `${remainingSeconds}s`;
}

export default function Sidebar() {
  const {
    visibleSections,
    activeHref,
    showSectionContext,
    showSectionDropdown,
    currentSection,
    sectionLabel,
    handleSectionChange,
    availableSections,
  } = useNavigationMenu();

  return (
    <aside className="hidden md:flex w-60 flex-col border-r bg-muted">
      <div className="flex-1 overflow-y-auto space-y-6 text-sm p-4 min-h-0">
        {showSectionContext && (
          <div>
            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase mb-1">Section</p>
            {showSectionDropdown && currentSection ? (
              <Select value={currentSection.sectionId} onValueChange={handleSectionChange}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map((section) => (
                    <SelectItem key={section.sectionId} value={section.sectionId}>
                      {section.sectionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="px-2 text-sm text-muted-foreground truncate">{sectionLabel}</div>
            )}
          </div>
        )}

        {visibleSections.map((section, idx) => {
          return (
            <div key={section.title ?? idx} className="space-y-2">
              {section.title && (
                <p className="px-2 text-xs font-semibold text-muted-foreground uppercase">{section.title}</p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      activeHref === item.href
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-border/80 px-4 py-4 bg-muted">
        <RateLimitSidebarIndicator />
      </div>
    </aside>
  );
}

function RateLimitSidebarIndicator() {
  const { data, isError, isFetching } = useRateLimitTelemetry();

  const view = useMemo(() => {
    if (!data) return null;

    const quotaCooldownSeconds = (() => {
      if (!data.quota || typeof data.quota.reset !== "number") return null;
      const raw = data.quota.reset;

      if (!Number.isFinite(raw) || raw <= 0) return null;

      const currentSeconds = Math.floor(Date.now() / 1000);
      const looksLikeEpochSeconds = raw > 1_000_000_000;
      const looksLikeEpochMilliseconds = raw > 1_000_000_000_000;

      let secondsUntilReset: number;
      if (looksLikeEpochMilliseconds) {
        secondsUntilReset = Math.round(raw / 1000 - currentSeconds);
      } else if (looksLikeEpochSeconds) {
        secondsUntilReset = Math.round(raw - currentSeconds);
      } else {
        secondsUntilReset = Math.round(raw);
      }

      if (!Number.isFinite(secondsUntilReset) || secondsUntilReset <= 0) return null;
      return secondsUntilReset;
    })();

    if (data.hardLocked) {
      const ttl = formatDuration(data.hardLockTtlSeconds);
      return {
        label: "Blocked",
        detail: `Upstream blocked${ttl ? ` • ${ttl} remaining` : ""}`,
        dotClass: "bg-destructive",
        cooldownSeconds: data.hardLockTtlSeconds ?? quotaCooldownSeconds,
      };
    }

    if (data.softLocked) {
      const ttl = formatDuration(data.softLockTtlSeconds);
      return {
        label: "Cooling",
        detail: ttl ? `Resumes in ${ttl}` : "Resuming shortly",
        dotClass: "bg-amber-500",
        cooldownSeconds: data.softLockTtlSeconds ?? quotaCooldownSeconds,
      };
    }

    if (data.quota && data.quota.limit > 0) {
      const percentUsed = ((data.quota.limit - data.quota.remaining) / data.quota.limit) * 100;
      const usageDetail = `${data.quota.remaining}/${data.quota.limit} remaining`;
      if (percentUsed >= 80) {
        return {
          label: "High usage",
          detail: usageDetail,
          dotClass: "bg-amber-500",
          cooldownSeconds: data.softLockTtlSeconds ?? quotaCooldownSeconds,
        };
      }

      return {
        label: "Stable",
        detail: usageDetail,
        dotClass: "bg-emerald-500",
        cooldownSeconds: data.softLockTtlSeconds ?? quotaCooldownSeconds,
      };
    }

    return {
      label: "Stable",
      detail: null,
      dotClass: "bg-emerald-500",
      cooldownSeconds: data.softLockTtlSeconds ?? quotaCooldownSeconds,
    };
  }, [data]);

  const statusLabel = view?.label ?? (isFetching ? "Checking…" : isError ? "Unavailable" : "Unknown");
  const dotClass = view?.dotClass ?? (isError ? "bg-amber-500/70" : "bg-muted-foreground/40");
  const detail = view?.detail ?? null;
  const cooldownText = formatDuration(view?.cooldownSeconds ?? null);

  return (
    <div className="mt-4 border-t border-border/80 pt-4 text-[11px] text-muted-foreground shrink-0">
      <div className="flex items-center justify-between gap-2" title={detail ?? undefined}>
        <span className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", dotClass)} aria-hidden />
          <span className="uppercase tracking-wide">Rate limit</span>
        </span>
        <span className="text-foreground font-medium">{statusLabel}</span>
      </div>
      {detail ? <p className="mt-1 text-muted-foreground/80">{detail}</p> : null}
      {cooldownText ? (
        <p className="mt-1 text-muted-foreground/70">
          Cooldown: <span className="text-foreground font-medium">{cooldownText}</span>
        </p>
      ) : null}
    </div>
  );
}
