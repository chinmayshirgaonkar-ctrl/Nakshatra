"use client";

import * as React from "react";
import { useState } from "react";
import { StarNode, RenderLink } from "./sky-types";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  GraduationCap,
  X,
  Clock,
  ArrowRight,
  Flame,
  CheckCircle2,
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface StarDrawerProps {
  star: StarNode;
  links: RenderLink[];
  onClose: () => void;
  onFocusStar: (starId: string) => void;
  onUpdateStarFSRS: (conceptId: string, rating: number) => Promise<void>;
}

export function StarDrawer({
  star,
  links,
  onClose,
  onFocusStar,
  onUpdateStarFSRS,
}: StarDrawerProps) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const percent = Math.round(star.retrievability * 100);
  const fsrs = star.concept.fsrs;

  // Filter links connected to this star
  const connectedLinks = links.filter(
    (l) => l.source.id === star.id || l.target.id === star.id
  );

  const handleRatingSubmit = async (rating: number) => {
    setIsSubmittingRating(true);
    try {
      await onUpdateStarFSRS(star.id, rating);
      toast.success("Star rekindled! Stability increased.");
      setIsReviewing(false);
      setHasRevealed(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update FSRS rating.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gold/20 bg-night/95 p-6 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-gold/15">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full border shadow-sm"
            style={{
              backgroundColor: star.color,
              borderColor: `${star.color}80`,
              boxShadow: `0 0 10px ${star.color}80`,
            }}
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-mist">
            {star.subject.name} • {star.topic.name}
          </span>
        </div>

        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-mist hover:text-ivory hover:bg-veil/60 transition-colors"
          aria-label="Close star drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Star Header */}
      <div className="py-5 space-y-1">
        <h2 className="font-fraunces text-2xl md:text-3xl font-light text-ivory tracking-tight leading-snug">
          {star.concept.name}
        </h2>
        {star.concept.marathiName && (
          <p className="font-tiro text-sm text-gold-soft">{star.concept.marathiName}</p>
        )}
      </div>

      {/* Memory Telemetry Card */}
      <div className="rounded-2xl border border-gold/20 bg-deep/70 p-4 mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-mist flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-soft" />
            <span>FSRS Memory Health</span>
          </span>
          <span
            className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full ${
              star.retrievability >= 0.8
                ? "bg-aurora/15 text-aurora border border-aurora/30"
                : star.retrievability >= 0.5
                ? "bg-gold/15 text-gold border border-gold/30"
                : "bg-ember/15 text-ember border border-ember/30 animate-pulse"
            }`}
          >
            {percent}% Retrievability
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-veil overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              star.retrievability >= 0.8
                ? "bg-aurora"
                : star.retrievability >= 0.5
                ? "bg-gold"
                : "bg-ember"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gold/10 text-center font-mono text-xs">
          <div className="rounded-xl bg-veil/40 p-2">
            <span className="text-[10px] text-mist block">Stability</span>
            <span className="font-semibold text-ivory">
              {fsrs?.stability ? `${fsrs.stability}d` : "1.0d"}
            </span>
          </div>
          <div className="rounded-xl bg-veil/40 p-2">
            <span className="text-[10px] text-mist block">Difficulty</span>
            <span className="font-semibold text-ivory">
              {fsrs?.difficulty ? `${fsrs.difficulty}/10` : "5.0/10"}
            </span>
          </div>
          <div className="rounded-xl bg-veil/40 p-2">
            <span className="text-[10px] text-mist block">Reps / Lapses</span>
            <span className="font-semibold text-ivory">
              {fsrs?.reps || 0} / {fsrs?.lapses || 0}
            </span>
          </div>
        </div>

        {fsrs?.due && (
          <div className="flex items-center justify-between text-[11px] font-mono text-mist pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gold-soft" />
              <span>Next Due:</span>
            </span>
            <span className={star.isFading ? "text-ember font-semibold" : "text-ivory"}>
              {new Date(fsrs.due).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Quick Recall Review Flow */}
      {isReviewing ? (
        <div className="rounded-2xl border border-gold/30 bg-deep/90 p-4 mb-5 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-gold-soft">Active Recall Check</span>
            <button
              onClick={() => {
                setIsReviewing(false);
                setHasRevealed(false);
              }}
              className="text-xs text-mist hover:text-ivory"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-mist font-manrope">
            Test yourself: What is the principle, mechanism, or definition of{" "}
            <span className="text-ivory font-semibold">{star.concept.name}</span>?
          </p>

          {!hasRevealed ? (
            <Button
              type="button"
              variant="celestial"
              className="w-full text-xs"
              onClick={() => setHasRevealed(true)}
            >
              Reveal Canonical Definition
            </Button>
          ) : (
            <div className="space-y-3 pt-2 border-t border-gold/15">
              <div className="rounded-xl bg-veil/50 p-3 text-xs text-ivory leading-relaxed font-manrope">
                {star.concept.definition}
              </div>

              <span className="text-[10px] font-mono uppercase text-mist block text-center">
                Rate your recall quality:
              </span>

              <div className="grid grid-cols-4 gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSubmittingRating}
                  onClick={() => handleRatingSubmit(1)}
                  className="text-[10px] border-ember/30 hover:bg-ember/20 text-ember"
                >
                  Again
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSubmittingRating}
                  onClick={() => handleRatingSubmit(2)}
                  className="text-[10px] border-gold/30 hover:bg-gold/20 text-gold"
                >
                  Hard
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSubmittingRating}
                  onClick={() => handleRatingSubmit(3)}
                  className="text-[10px] border-aurora/30 hover:bg-aurora/20 text-aurora"
                >
                  Good
                </Button>
                <Button
                  size="sm"
                  variant="celestial"
                  disabled={isSubmittingRating}
                  onClick={() => handleRatingSubmit(4)}
                  className="text-[10px]"
                >
                  Easy
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Action 1: Review Now CTA */
        <Button
          type="button"
          variant={star.isFading ? "celestial" : "outline"}
          onClick={() => setIsReviewing(true)}
          className="w-full gap-2 mb-4"
        >
          {star.isFading ? <Flame className="w-4 h-4 text-night" /> : <RefreshCw className="w-4 h-4 text-gold" />}
          <span>{star.isFading ? "Rekindle Star (Review Now)" : "Review Concept Card"}</span>
        </Button>
      )}

      {/* Canonical Definition */}
      <div className="space-y-2 mb-6">
        <label className="text-xs font-mono uppercase text-mist block">Canonical Principle</label>
        <div className="rounded-2xl border border-gold/15 bg-veil/30 p-4 font-manrope text-xs md:text-sm text-ivory/95 leading-relaxed">
          {star.concept.definition}
        </div>
      </div>

      {/* Connected Stars in Constellation */}
      {connectedLinks.length > 0 && (
        <div className="space-y-2 mb-6">
          <label className="text-xs font-mono uppercase text-mist block">
            Constellation Links ({connectedLinks.length})
          </label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {connectedLinks.map((link) => {
              const otherStar = link.source.id === star.id ? link.target : link.source;
              return (
                <button
                  key={link.id}
                  onClick={() => onFocusStar(otherStar.id)}
                  className="w-full flex items-center justify-between rounded-xl border border-gold/10 bg-veil/20 px-3 py-2 text-left hover:border-gold/30 hover:bg-veil/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: otherStar.color }}
                    />
                    <span className="text-xs font-fraunces text-ivory truncate group-hover:text-gold transition-colors">
                      {otherStar.concept.name}
                    </span>
                  </div>
                  {link.isCrossSubject ? (
                    <span className="text-[9px] font-mono text-aurora shrink-0 ml-2">
                      Cross-Subject
                    </span>
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-mist group-hover:text-gold shrink-0 transition-transform group-hover:translate-x-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Secondary Actions */}
      <div className="mt-auto space-y-2 pt-4 border-t border-gold/15">
        <Link href={`/trials?conceptId=${star.id}&count=5`}>
          <Button variant="outline" className="w-full justify-between gap-2 text-xs">
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-gold-soft" />
              <span>Quiz this star</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-mist" />
          </Button>
        </Link>

        <Link href={`/apprentice?conceptId=${star.id}`}>
          <Button variant="outline" className="w-full justify-between gap-2 text-xs">
            <span className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-aurora" />
              <span>Teach it to the Apprentice</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-mist" />
          </Button>
        </Link>

        {star.concept.materialId && (
          <Link href={`/reading-room?id=${star.concept.materialId}`}>
            <Button variant="ghost" className="w-full justify-between gap-2 text-xs text-mist hover:text-ivory">
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-mist" />
                <span>Open source manuscript</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-mist" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
