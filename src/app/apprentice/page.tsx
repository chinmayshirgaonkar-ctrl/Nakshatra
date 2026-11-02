import * as React from "react";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import { getConcepts, getSubjects, getTopics } from "@/server/db/repository";
import { ApprenticeClient } from "@/components/apprentice/apprentice-client";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "The Apprentice (शिष्य) | Nakshatra",
  description: "Feynman technique chamber with an inquisitive student AI and comprehensive Gap Report.",
};

export default async function ApprenticePage() {
  const user = await requireUser();
  const [concepts, subjects, topics] = await Promise.all([
    getConcepts(user.uid),
    getSubjects(user.uid),
    getTopics(user.uid),
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
        <ApprenticeClient
          initialConcepts={concepts}
          initialSubjects={subjects}
          initialTopics={topics}
        />
      </Suspense>
    </AppShell>
  );
}
