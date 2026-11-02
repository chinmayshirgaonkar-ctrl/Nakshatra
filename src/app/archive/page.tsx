import * as React from "react";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import { getMaterials, getSubjects } from "@/server/db/repository";
import { ArchiveChat } from "@/components/archive/archive-chat";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Ask the Archive | Nakshatra",
  description: "Chat grounded strictly in your personal study materials with Firestore vector search and inline passage citations.",
};

export default async function ArchivePage() {
  const user = await requireUser();
  const [materials, subjects] = await Promise.all([
    getMaterials(user.uid),
    getSubjects(user.uid),
  ]);

  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        }
      >
        <ArchiveChat materials={materials} subjects={subjects} />
      </Suspense>
    </AppShell>
  );
}
