import * as React from "react";
import { requireUser } from "@/lib/auth/require-user";
import { AppShell } from "@/components/shell/app-shell";
import { getSubjects, getTopics, getMaterials } from "@/server/db/repository";
import { TrialsClient } from "@/components/trials/trials-client";

export default async function TrialsPage() {
  const user = await requireUser();
  const [subjects, topics, materials] = await Promise.all([
    getSubjects(user.uid),
    getTopics(user.uid),
    getMaterials(user.uid),
  ]);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gold/15">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
                Crucible of Intellect
              </span>
            </div>
            <h1 className="font-fraunces text-3xl font-light text-ivory">The Trials</h1>
          </div>
        </div>

        <React.Suspense
          fallback={
            <div className="py-20 text-center font-mono text-xs text-gold-soft animate-pulse">
              Preparing the Celestial Crucible…
            </div>
          }
        >
          <TrialsClient
            subjects={subjects}
            topics={topics}
            materials={materials}
          />
        </React.Suspense>
      </div>
    </AppShell>
  );
}
