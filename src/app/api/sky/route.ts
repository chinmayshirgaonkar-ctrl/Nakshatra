import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import {
  getConcepts,
  getTopics,
  getSubjects,
  getConceptLinks,
} from "@/server/db/repository";

export async function GET() {
  try {
    const user = await requireUser();
    const [concepts, topics, subjects, links] = await Promise.all([
      getConcepts(user.uid),
      getTopics(user.uid),
      getSubjects(user.uid),
      getConceptLinks(user.uid),
    ]);

    return NextResponse.json({
      concepts,
      topics,
      subjects,
      links,
    });
  } catch (error: any) {
    console.error("Sky API Error:", error);
    if (error.message?.includes("Unauthorized") || error.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
