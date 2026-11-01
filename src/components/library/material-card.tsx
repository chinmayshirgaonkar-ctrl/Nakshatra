"use client";

import * as React from "react";
import { Material, Concept } from "@/lib/types/models";
import {
  FileText,
  Camera,
  Globe,
  Upload,
  Star,
  BookOpen,
  Trash2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MaterialCardProps {
  material: Material;
  concepts: Concept[];
  onDelete: (id: string) => Promise<void>;
}

export function MaterialCard({ material, concepts, onDelete }: MaterialCardProps) {
  const [deleting, setDeleting] = React.useState(false);

  const materialConcepts = concepts.filter((c) => c.materialId === material.id);

  // Compute memory health based on FSRS stability & due date
  const now = Date.now();
  const dueCount = materialConcepts.filter(
    (c) => new Date(c.fsrs.due).getTime() <= now
  ).length;

  const SourceIcon =
    material.sourceType === "pdf"
      ? Upload
      : material.sourceType === "image"
      ? Camera
      : material.sourceType === "url"
      ? Globe
      : FileText;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remove scroll "${material.title}"?`)) {
      setDeleting(true);
      try {
        await onDelete(material.id);
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-[22px] border border-gold/15 bg-deep/80 p-5 shadow-deep transition-all duration-300 hover:border-gold/35 hover:shadow-astral">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-gold/20 bg-veil text-gold">
              <SourceIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-mist">
              {material.sourceType} • {material.chunkCount} chunk{material.chunkCount > 1 ? "s" : ""}
            </span>
          </div>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1 text-mist/60 hover:text-ember opacity-0 group-hover:opacity-100 transition-all rounded"
            title="Delete scroll"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <Link href={`/reading-room?id=${material.id}`}>
          <h3 className="font-fraunces text-lg text-ivory font-normal leading-snug group-hover:text-gold transition-colors line-clamp-2 mb-2">
            {material.title}
          </h3>
        </Link>
      </div>

      {/* Footer Info & Reading Room Action */}
      <div className="pt-4 border-t border-gold/10 mt-3">
        <div className="flex items-center justify-between text-xs mb-3 font-mono">
          <div className="flex items-center gap-1.5 text-gold-soft">
            <Star className="w-3.5 h-3.5 text-gold fill-gold" />
            <span>{materialConcepts.length} stars</span>
          </div>

          {dueCount > 0 ? (
            <span className="text-ember text-[11px] font-mono">
              {dueCount} dimming
            </span>
          ) : (
            <span className="text-aurora text-[11px] font-mono">
              Equilibrium
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-mist">
            {material.wordCount.toLocaleString()} words
          </span>

          <Link
            href={`/reading-room?id=${material.id}`}
            className="flex items-center gap-1 text-xs font-manrope text-gold hover:text-gold-soft font-medium transition-colors"
          >
            <span>Contemplate</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
