import { ChamberSkeleton } from "@/components/ui/chamber-skeleton";

export default function Loading() {
  return (
    <ChamberSkeleton
      chamberName="Ask the Archive"
      marathiName="ग्रंथालय संवाद"
      subtitle="Connecting Firestore Vector Space & Grounding Indices..."
    />
  );
}
