import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getConcepts, getMaterialWithChunks } from "@/server/db/repository";
import { generateApprenticeReply } from "@/server/ai/modes";
import { checkAndIncrementAiUsage } from "@/server/ai/rate-limiter";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const quota = await checkAndIncrementAiUsage(user.uid);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Daily AI quota reached (${quota.count}/${quota.limit}). Resets at midnight UTC.` },
        { status: 429 }
      );
    }
    const body = await req.json();
    const { conceptId, conversationHistory = [], language = "en" } = body;

    if (!conceptId || conversationHistory.length === 0) {
      return NextResponse.json(
        { error: "conceptId and conversationHistory are required." },
        { status: 400 }
      );
    }

    // Fetch the concept
    const allConcepts = await getConcepts(user.uid);
    const concept = allConcepts.find((c) => c.id === conceptId);
    if (!concept) {
      return NextResponse.json({ error: "Concept not found." }, { status: 404 });
    }

    // Optional: Fetch canonical text snippet from material
    let canonicalText = "";
    if (concept.materialId) {
      try {
        const mat = await getMaterialWithChunks(user.uid, concept.materialId);
        if (mat) {
          canonicalText = mat.chunks.slice(0, 2).map((c) => c.text).join("\n\n");
        }
      } catch (e) {
        // Continue
      }
    }

    const reply = await generateApprenticeReply({
      concept,
      canonicalText,
      conversationHistory,
      language,
    });

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Apprentice Chat API error:", error);
    if (error.message?.includes("Unauthorized") || error.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
