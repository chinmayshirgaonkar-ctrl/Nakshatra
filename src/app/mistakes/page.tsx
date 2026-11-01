import * as React from "react";
import { requireUser } from "@/lib/auth/require-user";
import { AppShell } from "@/components/shell/app-shell";
import { getMistakes } from "@/server/db/repository";
import { MistakesGallery } from "@/components/mistakes/mistakes-gallery";

export default async function MistakesPage() {
  const user = await requireUser();
  const mistakes = await getMistakes(user.uid);

  return (
    <AppShell>
      <MistakesGallery initialMistakes={mistakes} />
    </AppShell>
  );
}
