import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user";
import { gradeShortAnswer } from "@/server/ai/trials";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { questionPrompt, modelAnswer, rubricKeywords, userAnswer, language = "en" } = body;

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
      language: language === "mr" ? "mr" : "en",
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
