import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getConcepts, saveApprenticeLesson } from "@/server/db/repository";
import { generateApprenticeGapReport } from "@/server/ai/modes";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const {
      conceptId,
      conversationHistory = [],
      language = "en",
    } = body;

    if (!conceptId || conversationHistory.length === 0) {
      return NextResponse.json(
        { error: "conceptId and conversationHistory are required." },
        { status: 400 }
      );
    }

    const allConcepts = await getConcepts(user.uid);
    const concept = allConcepts.find((c) => c.id === conceptId);
    if (!concept) {
      return NextResponse.json({ error: "Concept not found." }, { status: 404 });
    }

    // Generate Gap Report with Gemini
    const gapReport = await generateApprenticeGapReport({
      concept,
      conversationHistory,
      language,
    });

    // Save lesson and update FSRS card in Firestore
    const { lesson, fsrsChange } = await saveApprenticeLesson(user.uid, {
      conceptId: concept.id,
      conceptName: concept.name,
      subjectId: concept.subjectId,
      topicId: concept.topicId,
      language,
      messages: conversationHistory.map((m: any, idx: number) => ({
        id: `msg-${idx}`,
        sender: m.role,
        text: m.text,
        timestamp: new Date().toISOString(),
      })),
      gapReport,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      gapReport,
      lesson,
      fsrsChange,
    });
  } catch (error: any) {
    console.error("Apprentice End Lesson API error:", error);
    if (error.message?.includes("Unauthorized") || error.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
