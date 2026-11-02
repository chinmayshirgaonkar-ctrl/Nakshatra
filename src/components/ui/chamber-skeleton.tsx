import * as React from "react";
import { Loader2, Star } from "lucide-react";

interface ChamberSkeletonProps {
  chamberName: string;
  subtitle?: string;
}

export function ChamberSkeleton({
  chamberName,
  subtitle = "Aligning celestial coordinates...",
}: ChamberSkeletonProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gold/15">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
              {chamberName}
            </span>
          </div>
          <div className="h-8 w-48 rounded-xl bg-veil animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-veil animate-pulse" />
      </div>

      {/* Main Chamber loader */}
      <div className="flex flex-col items-center justify-center rounded-[28px] border border-gold/15 bg-deep/40 p-12 md:p-20 text-center backdrop-blur-sm min-h-[440px]">
        <div className="relative mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-gold/30 bg-veil shadow-astral">
            <Star className="h-8 w-8 text-gold animate-twinkle" />
          </div>
          <div className="absolute -inset-1 rounded-3xl border border-gold/20 animate-ping opacity-25" />
        </div>

        <span className="font-mono text-xs uppercase tracking-widest text-gold-soft mb-2">
          {chamberName}
        </span>
        <h3 className="font-fraunces text-xl md:text-2xl text-ivory mb-2 font-normal">
          {subtitle}
        </h3>
        <p className="font-manrope text-xs text-mist max-w-sm mb-6 flex items-center justify-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
          <span>Synchronizing with Firestore Cosmos...</span>
        </p>

        {/* Skeleton grid placeholders */}
        <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-gold/10">
          <div className="h-20 rounded-xl bg-veil/40 animate-pulse border border-gold/10" />
          <div className="h-20 rounded-xl bg-veil/40 animate-pulse border border-gold/10" />
          <div className="h-20 rounded-xl bg-veil/40 animate-pulse border border-gold/10" />
        </div>
      </div>
    </div>
  );
}
