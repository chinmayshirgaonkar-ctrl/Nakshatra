import * as React from "react";
import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import { getObservatoryOverview } from "@/server/db/repository";
import { ObservatoryDashboard } from "@/components/observatory/observatory-dashboard";

export default async function ObservatoryPage() {
  const user = await requireUser();
  const overview = await getObservatoryOverview(user.uid);

  return (
    <AppShell>
      <ObservatoryDashboard overview={overview} />
    </AppShell>
  );
}
