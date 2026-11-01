import * as React from "react";
import { AppShell } from "@/components/shell/app-shell";
import { getLibraryDataAction } from "./actions";
import { LibraryView } from "@/components/library/library-view";

export default async function LibraryPage() {
  const data = await getLibraryDataAction();

  return (
    <AppShell>
      <LibraryView
        initialSubjects={data.subjects}
        initialTopics={data.topics}
        initialMaterials={data.materials}
        initialConcepts={data.concepts}
      />
    </AppShell>
  );
}
