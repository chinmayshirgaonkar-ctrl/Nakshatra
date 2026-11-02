import * as React from "react";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import { getTopics, getSubjects, getConcepts } from "@/server/db/repository";
import { BlankPageClient } from "@/components/blank-page/blank-page-client";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Blank Page | Nakshatra",
  description: "Active unassisted recall parchment with Gemini fidelity analysis and FSRS rating updates.",
};

export default async function BlankPage() {
  const user = await requireUser();
  const [topics, subjects, concepts] = await Promise.all([
    getTopics(user.uid),
    getSubjects(user.uid),
    getConcepts(user.uid),
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
        <BlankPageClient
          initialTopics={topics}
          initialSubjects={subjects}
          initialConcepts={concepts}
        />
      </Suspense>
    </AppShell>
  );
}
