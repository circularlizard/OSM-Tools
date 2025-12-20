"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, CalendarDays, Users as UsersIcon, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/use-store";

export default function Sidebar() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isAdmin = (session as { roleSelection?: string } | null)?.roleSelection === "admin";
  const currentSection = useStore((s) => s.currentSection);
  const selectedSections = useStore((s) => s.selectedSections);
  const availableSections = useStore((s) => s.availableSections);
  const setCurrentSection = useStore((s) => s.setCurrentSection);
  const setSelectedSections = useStore((s) => s.setSelectedSections);
  const clearQueue = useStore((s) => s.clearQueue);
  const pathname = usePathname();

  const hasMultiSelection = selectedSections.length > 0;
  const sectionLabel = hasMultiSelection
    ? selectedSections.map((s) => s.sectionName).join(", ")
    : currentSection?.sectionName ?? "No section selected";

  // Show dropdown when user has more than one available section
  const showSectionDropdown = availableSections.length > 1;

  const handleSectionChange = (sectionId: string) => {
    const selected = availableSections.find(s => s.sectionId === sectionId);
    if (!selected) return;

    setCurrentSection({
      sectionId: selected.sectionId,
      sectionName: selected.sectionName,
      sectionType: selected.sectionType,
      termId: selected.termId,
    });
    setSelectedSections([]);
    clearQueue();

    // Clear cached data for old section
    queryClient.removeQueries({ queryKey: ['events'] });
    queryClient.removeQueries({ queryKey: ['event-summary'] });
    queryClient.removeQueries({ queryKey: ['attendance'] });
    queryClient.removeQueries({ queryKey: ['per-person-attendance'] });
    queryClient.removeQueries({ queryKey: ['members'] });

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[Sidebar] Section changed, cleared cached queries');
    }
  };

  return (
    <aside className="hidden md:block w-60 border-r bg-muted min-h-screen p-4">
      <nav className="space-y-2 text-sm">
        {/* Section summary */}
        <div className="mb-4">
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase mb-1">
            Section
          </p>
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
            <div className="px-2 text-sm text-muted-foreground truncate">
              {sectionLabel}
            </div>
          )}
        </div>

        <Link className="block px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground" href="/dashboard">
          Overview
        </Link>

        {/* Events section */}
        <div className="border-t my-4 pt-4">
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase mb-2">
            Events
          </p>
          <Link className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground" href="/dashboard/events">
            <CalendarDays className="h-4 w-4" />
            <span>Events</span>
          </Link>
          <Link className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground" href="/dashboard/events/attendance">
            <UsersIcon className="h-4 w-4" />
            <span>Attendance by Person</span>
          </Link>
        </div>

        {/* Admin section - only visible to administrators */}
        {isAdmin && (
          <div className="border-t my-4 pt-4">
            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase mb-2">
              Members
            </p>
            <Link
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
              href="/dashboard/members"
            >
              <UsersIcon className="h-4 w-4" />
              Members
            </Link>
            <Link
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
              href="/dashboard/members/issues"
            >
              <AlertTriangle className="h-4 w-4" />
              Member Data Issues
            </Link>
            <Link
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
              href="/dashboard/admin"
            >
              <Shield className="h-4 w-4" />
              Patrol data
            </Link>
          </div>
        )}

        <div className="border-t my-4 pt-4">
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase mb-2">
            Developer Tools
          </p>
          <Link
            className="block px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground"
            href="/dashboard/api-browser"
          >
            API Browser
          </Link>
          <Link
            className="block px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground"
            href="/dashboard/debug/queue"
          >
            Queue Debug
          </Link>
          <Link
            className="block px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground"
            href="/dashboard/debug/oauth"
          >
            OAuth Resource
          </Link>
        </div>
      </nav>
    </aside>
  );
}
