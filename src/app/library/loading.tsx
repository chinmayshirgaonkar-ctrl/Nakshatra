import { ChamberSkeleton } from "@/components/ui/chamber-skeleton";

export default function Loading() {
  return (
    <ChamberSkeleton
      chamberName="The Library"
      subtitle="Gathering Codex Scrolls & Partition Shelves..."
    />
  );
}
