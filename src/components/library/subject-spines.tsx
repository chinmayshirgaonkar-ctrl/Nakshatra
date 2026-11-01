"use client";

import * as React from "react";
import { useState } from "react";
import { Subject, Topic, Material } from "@/lib/types/models";
import {
  BookOpen,
  Compass,
  Sparkles,
  Globe,
  Atom,
  Brain,
  Cpu,
  Scroll,
  Flame,
  Scale,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Compass,
  Sparkles,
  Globe,
  Atom,
  Brain,
  Cpu,
  Scroll,
  Flame,
  Scale,
};

const PALETTE = [
  "#D4AF6A", // Celestial Gold
  "#6FD3C6", // Aurora
  "#E07A5F", // Ember
  "#8A7968", // Antique Bronze
  "#4A7C59", // Emerald
  "#5A6B7C", // Deep Slate
  "#8D5B4C", // Terracotta
  "#7A5C8D", // Amethyst
];

interface SubjectSpinesProps {
  subjects: Subject[];
  topics: Topic[];
  materials: Material[];
  selectedSubjectId: string | null;
  onSelectSubject: (id: string | null) => void;
  onCreateSubject: (data: { name: string; marathiName?: string; color: string; icon: string }) => Promise<void>;
  onUpdateSubject: (id: string, data: { name?: string; marathiName?: string; color?: string; icon?: string }) => Promise<void>;
  onDeleteSubject: (id: string) => Promise<void>;
  onReorderSubjects: (ids: string[]) => Promise<void>;
}

export function SubjectSpines({
  subjects,
  topics,
  materials,
  selectedSubjectId,
  onSelectSubject,
  onCreateSubject,
  onUpdateSubject,
  onDeleteSubject,
  onReorderSubjects,
}: SubjectSpinesProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [name, setName] = useState("");
  const [marathiName, setMarathiName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [icon, setIcon] = useState("BookOpen");
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setName("");
    setMarathiName("");
    setColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    setIcon("BookOpen");
    setEditingSubject(null);
    setCreateOpen(true);
  };

  const openEdit = (s: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    setName(s.name);
    setMarathiName(s.marathiName || "");
    setColor(s.color);
    setIcon(s.icon || "BookOpen");
    setEditingSubject(s);
    setCreateOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (editingSubject) {
        await onUpdateSubject(editingSubject.id, {
          name: name.trim(),
          marathiName: marathiName.trim() || undefined,
          color,
          icon,
        });
      } else {
        await onCreateSubject({
          name: name.trim(),
          marathiName: marathiName.trim() || undefined,
          color,
          icon,
        });
      }
      setCreateOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const moveSubject = async (index: number, direction: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= subjects.length) return;

    const reordered = [...subjects];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    await onReorderSubjects(reordered.map((s) => s.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
            Subject Partitions
          </span>
          <span className="font-tiro text-xs text-mist">विषय विभाग</span>
        </div>

        <Button
          onClick={openCreate}
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-gold/25 hover:border-gold"
        >
          <Plus className="w-3.5 h-3.5 text-gold" />
          <span>New Subject</span>
        </Button>
      </div>

      {/* Book Spines Row */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-1 scrollbar-none">
        {/* All Subjects Pill */}
        <button
          onClick={() => onSelectSubject(null)}
          className={cn(
            "relative flex shrink-0 flex-col justify-between rounded-2xl border px-4 py-3 transition-all duration-300 min-w-[120px] text-left",
            selectedSubjectId === null
              ? "bg-veil border-gold text-gold-soft shadow-astral"
              : "bg-deep/70 border-gold/15 text-mist hover:border-gold/30 hover:text-ivory"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="w-4 h-4 text-gold" />
            <span className="text-[10px] font-mono opacity-60">ALL</span>
          </div>
          <div>
            <span className="font-fraunces text-sm font-medium block">All Vaults</span>
            <span className="text-[10px] text-mist font-tiro">सर्व संग्रह</span>
          </div>
        </button>

        {/* Individual Subject Book Spine Cards */}
        {subjects.map((s, idx) => {
          const IconComp = ICONS[s.icon] || BookOpen;
          const isSelected = selectedSubjectId === s.id;
          const subjectTopics = topics.filter((t) => t.subjectId === s.id);
          const subjectMaterials = materials.filter((m) => m.subjectId === s.id);

          return (
            <div
              key={s.id}
              onClick={() => onSelectSubject(s.id)}
              style={{
                borderLeftColor: s.color,
                borderLeftWidth: "4px",
              }}
              className={cn(
                "group relative flex shrink-0 flex-col justify-between rounded-2xl border p-4 transition-all duration-300 min-w-[180px] max-w-[220px] cursor-pointer select-none",
                isSelected
                  ? "bg-veil border-gold text-gold-soft shadow-astral"
                  : "bg-deep/70 border-gold/15 text-mist hover:border-gold/35 hover:bg-veil/50 hover:text-ivory"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${s.color}25`, color: s.color }}
                >
                  <IconComp className="w-3.5 h-3.5" />
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx > 0 && (
                    <button
                      onClick={(e) => moveSubject(idx, -1, e)}
                      className="p-1 text-mist hover:text-gold rounded"
                      title="Move left"
                    >
                      <ArrowUp className="w-3 h-3 -rotate-90" />
                    </button>
                  )}
                  {idx < subjects.length - 1 && (
                    <button
                      onClick={(e) => moveSubject(idx, 1, e)}
                      className="p-1 text-mist hover:text-gold rounded"
                      title="Move right"
                    >
                      <ArrowDown className="w-3 h-3 -rotate-90" />
                    </button>
                  )}
                  <button
                    onClick={(e) => openEdit(s, e)}
                    className="p-1 text-mist hover:text-gold rounded"
                    title="Edit subject"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remove subject "${s.name}"?`)) {
                        onDeleteSubject(s.id);
                      }
                    }}
                    className="p-1 text-mist hover:text-ember rounded"
                    title="Delete subject"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div>
                <span className="font-fraunces text-base font-normal text-ivory block truncate group-hover:text-gold transition-colors">
                  {s.name}
                </span>
                {s.marathiName && (
                  <span className="text-[11px] font-tiro text-gold-soft/80 block truncate">
                    {s.marathiName}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 mt-2 border-t border-gold/10 text-[10px] font-mono text-mist">
                <span>{subjectTopics.length} topics</span>
                <span>{subjectMaterials.length} scrolls</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Subject Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? "Refine Subject Spine" : "Forge Subject Partition"}
            </DialogTitle>
            <DialogDescription>
              Assign a name, Marathi title, celestial color ribbon, and insignia.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-mist block mb-1.5">
                Subject Title (English)
              </label>
              <Input
                placeholder="e.g. Cognitive Philosophy"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-mist block mb-1.5">
                Marathi Subtitle (मराठी शीर्षक)
              </label>
              <Input
                placeholder="उदा. ज्ञान व चेतना"
                value={marathiName}
                onChange={(e) => setMarathiName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-mist block mb-2">
                Color Ribbon (रंग)
              </label>
              <div className="flex items-center gap-2.5">
                {PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColor(hex)}
                    style={{ backgroundColor: hex }}
                    className={cn(
                      "w-7 h-7 rounded-full transition-transform",
                      color === hex
                        ? "scale-125 ring-2 ring-gold ring-offset-2 ring-offset-deep"
                        : "opacity-70 hover:opacity-100"
                    )}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-mist block mb-2">
                Insignia Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {Object.keys(ICONS).map((iconKey) => {
                  const Comp = ICONS[iconKey];
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setIcon(iconKey)}
                      className={cn(
                        "flex items-center justify-center h-10 rounded-xl border transition-all",
                        icon === iconKey
                          ? "bg-veil border-gold text-gold"
                          : "border-gold/15 text-mist hover:text-ivory hover:bg-veil/50"
                      )}
                    >
                      <Comp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="celestial" disabled={submitting}>
                {submitting ? "Saving..." : editingSubject ? "Update Spine" : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
