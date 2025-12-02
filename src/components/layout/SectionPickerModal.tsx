"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/use-store";

interface Section { sectionId: string; sectionName: string }

export default function SectionPickerModal() {
  const sections = useStore((s) => s.availableSections);
  const currentSection = useStore((s) => s.currentSection);
  const setCurrentSection = useStore((s) => s.setCurrentSection);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const multiple = sections && sections.length > 1;
    const hasSelection = !!currentSection;
    setOpen(multiple && !hasSelection);
  }, [sections, currentSection]);

  if (!sections || sections.length <= 1) return null;

  const handlePick = (section: Section) => {
    setCurrentSection({ sectionId: section.sectionId, sectionName: section.sectionName, sectionType: '' });
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
            <Button key={s.sectionId} variant={currentSection?.sectionId === s.sectionId ? "default" : "secondary"} onClick={() => handlePick(s)}>
              {s.sectionName}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
