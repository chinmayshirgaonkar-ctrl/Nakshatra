import { ChamberSkeleton } from "@/components/ui/chamber-skeleton";

export default function Loading() {
  return (
    <ChamberSkeleton
      chamberName="Observatory"
      subtitle="Preparing Today's Celestial Ritual & Fading Stars..."
    />
  );
}
