import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user";
import { getMaterialWithChunks } from "@/server/db/repository";
import {
  explainSelection,
  makeStarFromSelection,
  quizSelection,
} from "@/server/ai/reading-room";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { action, selection, materialId, context, language = "en" } = body;

    if (!action || !selection || !materialId) {
      return NextResponse.json(
        { error: "action, selection, and materialId are required." },
        { status: 400 }
      );
    }

    const data = await getMaterialWithChunks(user.uid, materialId);
    if (!data) {
      return NextResponse.json({ error: "Material not found." }, { status: 404 });
    }

    const lang = language === "mr" ? "mr" : "en";

    if (action === "explain") {
      const explanation = await explainSelection({
        selection,
        surroundingContext: context,
        language: lang,
      });
      return NextResponse.json({ success: true, result: explanation });
    }

    if (action === "make-star") {
      const newConcept = await makeStarFromSelection({
        uid: user.uid,
        material: data.material,
        selection,
        language: lang,
      });
      return NextResponse.json({ success: true, concept: newConcept });
    }

    if (action === "quiz") {
      const quiz = await quizSelection({
        selection,
        surroundingContext: context,
        language: lang,
      });
      return NextResponse.json({ success: true, quiz });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error("Selection action error:", err);
    return NextResponse.json(
      { error: "Selection action failed.", details: err?.message },
      { status: 500 }
    );
  }
}
