"use client";

import { ChamberError } from "@/components/ui/chamber-error";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ChamberError
      error={error}
      reset={reset}
      chamberName="The Library"
      marathiName="ग्रंथालय दालन"
    />
  );
}
