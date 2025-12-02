"use client";
import { useStore } from "@/store/use-store";
import { Button } from "@/components/ui/button";

export default function Header() {
  const currentSection = useStore((s) => s.currentSection);
  const selectedSectionName = currentSection?.sectionName ?? null;
  return (
    <header className="w-full border-b bg-[var(--background)]">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold">SEEE Dashboard</span>
          {selectedSectionName && (
            <span className="text-sm text-[var(--muted-foreground)]">• {selectedSectionName}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">Settings</Button>
        </div>
      </div>
    </header>
  );
}
