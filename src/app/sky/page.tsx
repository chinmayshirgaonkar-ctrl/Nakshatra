import * as React from "react";
import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import {
  getConcepts,
  getTopics,
  getSubjects,
  getConceptLinks,
} from "@/server/db/repository";
import { SkyClient } from "@/components/sky/sky-client";

export default async function SkyPage() {
  const user = await requireUser();

  // Load initial data on server to avoid loading spinner
  const [concepts, topics, subjects, links] = await Promise.all([
    getConcepts(user.uid),
    getTopics(user.uid),
    getSubjects(user.uid),
    getConceptLinks(user.uid),
  ]);

  const initialSkyData = {
    concepts,
    topics,
    subjects,
    links,
  };

  return (
    <AppShell>
      <SkyClient initialData={initialSkyData} />
    </AppShell>
  );
}
