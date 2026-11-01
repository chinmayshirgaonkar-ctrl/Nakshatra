import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user";
import {
  updateConceptFSRSRatings,
  createMistakeExhibit,
  updateMistakeStreak,
  getConcepts,
} from "@/server/db/repository";
import { Rating } from "ts-fsrs";
import { ConfidenceLevel, QuestionType } from "@/lib/types/models";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const {
      questionPrompt,
      questionType,
      conceptIds = [],
      conceptNames = [],
      userAnswer,
      correctAnswer,
      isCorrect,
      confidence,
      whyWrong,
      correctReasoning,
      memoryHook,
      originalMistakeId,
    }: {
      questionPrompt: string;
      questionType: QuestionType;
      conceptIds: string[];
      conceptNames: string[];
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      confidence: ConfidenceLevel;
      whyWrong?: string;
      correctReasoning?: string;
      memoryHook?: string;
      originalMistakeId?: string;
    } = body;

    // 1. Determine FSRS Rating
    let rating: Rating;
    if (isCorrect) {
      if (confidence === "sure") {
        rating = Rating.Easy;
      } else if (confidence === "guessing") {
        rating = Rating.Hard;
      } else {
        rating = Rating.Good;
      }
    } else {
      rating = Rating.Again;
    }

    // 2. Batch update linked concept FSRS cards
    const updates = conceptIds.map((id) => ({ conceptId: id, rating }));
    const fsrsChanges = await updateConceptFSRSRatings(user.uid, updates);

    // 3. Museum of Mistakes logic
    let mistakeExhibit = null;
    let resolvedMistake = false;

    if (!isCorrect) {
      if (originalMistakeId) {
        // Reset streak on repeat error
        await updateMistakeStreak(user.uid, originalMistakeId, false);
      } else {
        // Add new exhibit to Museum of Mistakes
        mistakeExhibit = await createMistakeExhibit(user.uid, {
          question: questionPrompt,
          questionType: questionType || "mcq",
          userAnswer: String(userAnswer || ""),
          correctAnswer: String(correctAnswer || ""),
          whyWrong: whyWrong || "The concept was confused or causal chain was broken.",
          correctReasoning: correctReasoning || correctAnswer,
          memoryHook: memoryHook || "Focus on the foundational cause rather than the surface symptom.",
          conceptIds,
          conceptNames: conceptNames.length > 0 ? conceptNames : ["Star Axiom"],
          correctStreak: 0,
          resolved: false,
          createdAt: new Date().toISOString(),
          lastTestedAt: new Date().toISOString(),
        });
      }
    } else if (originalMistakeId) {
      // Re-trial success: increment streak
      const updated = await updateMistakeStreak(user.uid, originalMistakeId, true);
      if (updated?.resolved) {
        resolvedMistake = true;
      }
    }

    return NextResponse.json({
      success: true,
      rating,
      fsrsChanges,
      mistakeExhibit,
      resolvedMistake,
    });
  } catch (err: any) {
    console.error("Submit trial answer error:", err);
    return NextResponse.json(
      { error: "Failed to record answer.", details: err?.message },
      { status: 500 }
    );
  }
}
