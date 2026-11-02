import { ChamberSkeleton } from "@/components/ui/chamber-skeleton";

export default function Loading() {
  return (
    <ChamberSkeleton
      chamberName="The Sky"
      subtitle="Projecting Constellations & FSRS Brightness Fields..."
    />
  );
}
