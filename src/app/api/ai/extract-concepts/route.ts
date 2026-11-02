import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user";
import { extractConceptsFromText } from "@/server/ai/concept-extractor";
import { getConcepts, createConceptsAndLinks } from "@/server/db/repository";
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
    const { materialId, topicId, subjectId, text, regenerate } = body;

    if (!materialId || !topicId || !subjectId || !text) {
      return NextResponse.json(
        { error: "Missing required payload parameters (materialId, topicId, subjectId, text)." },
        { status: 400 }
      );
    }

    // Fetch existing concepts in the cosmos to detect cross-topic links
    const allUserConcepts = await getConcepts(user.uid);
    const existingConcepts = allUserConcepts
      .filter((c) => c.materialId !== materialId)
      .map((c) => ({ id: c.id, name: c.name }));

    // Run concept extraction with Gemini
    const { concepts, links } = await extractConceptsFromText({
      uid: user.uid,
      materialId,
      topicId,
      subjectId,
      text,
      existingConcepts,
      regenerate: !!regenerate,
    });

    // Save to Firestore repository
    const { createdConcepts, createdLinks } = await createConceptsAndLinks(
      user.uid,
      concepts,
      links
    );

    return NextResponse.json({
      success: true,
      concepts: createdConcepts,
      links: createdLinks,
      count: createdConcepts.length,
    });
  } catch (err: any) {
    console.error("Concept extraction API error:", err);
    return NextResponse.json(
      { error: "Failed to extract concepts.", details: err?.message },
      { status: 500 }
    );
  }
}
