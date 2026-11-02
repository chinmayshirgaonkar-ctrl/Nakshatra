"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, Compass } from "lucide-react";
import Link from "next/link";

interface ChamberErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  chamberName?: string;
  marathiName?: string;
}

export function ChamberError({
  error,
  reset,
  chamberName = "Chamber",
  marathiName = "दालन",
}: ChamberErrorProps) {
  React.useEffect(() => {
    console.error(`Error encountered in ${chamberName}:`, error);
  }, [error, chamberName]);

  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-rose-500/25 bg-deep/60 p-12 md:p-16 text-center backdrop-blur-xl shadow-astral my-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-rose-500/40 bg-rose-500/10 shadow-astral mb-5">
        <AlertCircle className="h-8 w-8 text-rose-400" />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-rose-400">
          Astrolabe Disturbance
        </span>
        <span className="h-1 w-1 rounded-full bg-rose-400/50" />
        <span className="font-tiro text-xs text-mist">{marathiName} त्रुटी</span>
      </div>

      <h2 className="font-fraunces text-2xl md:text-3xl text-ivory mb-2 font-normal">
        The Coordinates Have Drifted
      </h2>
      <p className="font-manrope text-xs text-mist max-w-md leading-relaxed mb-6">
        {error.message ||
          "An unexpected disturbance occurred while rendering this chamber. The astrolabe could not complete the calculation."}
      </p>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          className="border-gold/30 hover:border-gold text-ivory gap-2 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Realignt Coordinates (Retry)</span>
        </Button>

        <Link href="/observatory">
          <Button
            type="button"
            variant="celestial"
            className="gap-2 text-xs text-night font-semibold shadow-astral"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Return to Observatory</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
