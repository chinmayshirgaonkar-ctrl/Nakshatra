import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { askArchiveQuestion } from "@/server/ai/archive";
import { checkAndIncrementAiUsage } from "@/server/ai/rate-limiter";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const body = await req.json();
    const { question, conversationHistory = [] } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "A non-empty question is required." },
        { status: 400 }
      );
    }

    const quota = await checkAndIncrementAiUsage(user.uid);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Daily AI quota reached (${quota.count}/${quota.limit}). Resets at midnight UTC.`,
        },
        { status: 429 }
      );
    }

    const result = await askArchiveQuestion({
      uid: user.uid,
      question: question.trim(),
      conversationHistory,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Archive Ask API error:", error);
    if (error.message?.includes("Unauthorized") || error.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to query the Archive." },
      { status: 500 }
    );
  }
}
