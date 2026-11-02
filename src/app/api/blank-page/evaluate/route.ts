import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import {
  getTopics,
  getConcepts,
  getMaterials,
  getMaterialWithChunks,
  saveBlankPageSession,
} from "@/server/db/repository";
import { evaluateBlankPageRecall } from "@/server/ai/modes";
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
    const {
      topicId,
      recallText,
      durationSeconds = 0,
      language = "en",
    } = body;

    if (!topicId || !recallText || !recallText.trim()) {
      return NextResponse.json(
        { error: "topicId and recallText are required." },
        { status: 400 }
      );
    }

    // Get topics to find matching topic
    const allTopics = await getTopics(user.uid);
    const topic = allTopics.find((t) => t.id === topicId);
    if (!topic) {
      return NextResponse.json({ error: "Topic not found." }, { status: 404 });
    }

    // Get all concepts under this topic
    const concepts = await getConcepts(user.uid, { topicId });
    if (concepts.length === 0) {
      return NextResponse.json(
        { error: "This topic has no concepts to evaluate against. Add study material first." },
        { status: 400 }
      );
    }

    // Optional: Get source text context from materials
    let sourceContext = "";
    try {
      const materials = await getMaterials(user.uid, topicId);
      if (materials.length > 0) {
        const mat = await getMaterialWithChunks(user.uid, materials[0].id);
        if (mat) {
          sourceContext = mat.chunks.map((c) => c.text).join("\n\n");
        }
      }
    } catch (e) {
      // Continue even if source material fetch fails
    }

    // Evaluate unassisted recall with Gemini
    const evaluation = await evaluateBlankPageRecall({
      recallText: recallText.trim(),
      topic,
      concepts,
      sourceContext,
      language,
    });

    // Save session and batch update FSRS cards
    const { session, fsrsChanges } = await saveBlankPageSession(user.uid, {
      topicId,
      topicName: topic.name,
      subjectId: topic.subjectId,
      recallText: recallText.trim(),
      durationSeconds: Number(durationSeconds) || 0,
      evaluation,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      evaluation,
      session,
      fsrsChanges,
    });
  } catch (error: any) {
    console.error("Blank Page Evaluation API error:", error);
    if (error.message?.includes("Unauthorized") || error.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
