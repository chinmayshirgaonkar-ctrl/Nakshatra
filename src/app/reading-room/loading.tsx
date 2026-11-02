import { ChamberSkeleton } from "@/components/ui/chamber-skeleton";

export default function Loading() {
  return (
    <ChamberSkeleton
      chamberName="The Reading Room"
      subtitle="Preparing Magazine Ingestion & Radial Mind Map..."
    />
  );
}
