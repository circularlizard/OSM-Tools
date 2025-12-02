"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-store";

interface Section {
  id: string;
  name: string;
}

export default function SectionPickerModal() {
  const sections = useAppStore((s) => s.sections);
  const selectedSectionId = useAppStore((s) => s.selectedSectionId);
  const setSelectedSectionId = useAppStore((s) => s.setSelectedSectionId);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const multiple = sections && sections.length > 1;
    const hasSelection = !!selectedSectionId;
    setOpen(multiple && !hasSelection);
  }, [sections, selectedSectionId]);

  if (!sections || sections.length <= 1) return null;

  const handlePick = (id: string) => {
    setSelectedSectionId(id);
    setOpen(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent aria-describedby="section-picker-description">
        <DialogHeader>
          <DialogTitle>Select a Section</DialogTitle>
        </DialogHeader>
        <p id="section-picker-description" className="text-sm text-[var(--muted-foreground)]">
          Choose which section to view. You can change this later from the header.
        </p>
        <div className="grid grid-cols-1 gap-2 mt-3">
          {sections.map((s: Section) => (
            <Button key={s.id} variant={s.id === selectedSectionId ? "default" : "secondary"} onClick={() => handlePick(s.id)}>
              {s.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
