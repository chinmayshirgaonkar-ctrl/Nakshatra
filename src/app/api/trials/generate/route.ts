import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user";
import {
  getConcepts,
  getWeakestConcepts,
  getMaterialWithChunks,
} from "@/server/db/repository";
import { generateQuizQuestions } from "@/server/ai/trials";
import { checkAndIncrementAiUsage } from "@/server/ai/rate-limiter";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const quota = await checkAndIncrementAiUsage(user.uid);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Daily AI quota reached (${quota.count}/${quota.limit}). Resets at midnight UTC.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      scope = "all",
      targetId,
      count = 5,
      difficulty = "honest",
      types = ["mcq", "true_false_why", "fill_blank", "short_answer"],
    } = body;

    let candidateConcepts = [];
    let contextText = "";

    if (scope === "weakest") {
      candidateConcepts = await getWeakestConcepts(user.uid, Math.max(10, count * 2));
    } else if (scope === "topic" && targetId) {
      candidateConcepts = await getConcepts(user.uid, { topicId: targetId });
    } else if (scope === "material" && targetId) {
      candidateConcepts = await getConcepts(user.uid, { materialId: targetId });
      const matData = await getMaterialWithChunks(user.uid, targetId);
      if (matData) {
        contextText = matData.chunks.map((c) => c.text).join("\n\n");
      }
    } else {
      candidateConcepts = await getConcepts(user.uid);
    }

    if (candidateConcepts.length === 0) {
      return NextResponse.json(
        {
          error:
            "No concepts found for this trial scope. Add material to your Library to light up concept stars first.",
        },
        { status: 400 }
      );
    }

    const questions = await generateQuizQuestions({
      concepts: candidateConcepts,
      contextText,
      count: Math.min(20, Math.max(3, count)),
      difficulty,
      types,
    });

    return NextResponse.json({ success: true, questions });
  } catch (err: any) {
    console.error("Trial generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate trial questions.", details: err?.message },
      { status: 500 }
    );
  }
}
