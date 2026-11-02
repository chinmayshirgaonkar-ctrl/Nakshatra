import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user";
import { gradeShortAnswer } from "@/server/ai/trials";
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
    const { questionPrompt, modelAnswer, rubricKeywords, userAnswer } = body;

    if (!questionPrompt || !userAnswer?.trim()) {
      return NextResponse.json(
        { error: "questionPrompt and non-empty userAnswer are required." },
        { status: 400 }
      );
    }

    const result = await gradeShortAnswer({
      questionPrompt,
      modelAnswer,
      rubricKeywords: rubricKeywords || [],
      userAnswer: userAnswer.trim(),
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("Short answer grading error:", err);
    return NextResponse.json(
      { error: "Failed to grade short answer.", details: err?.message },
      { status: 500 }
    );
  }
}
