import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user";
import { getMaterialWithChunks } from "@/server/db/repository";
import {
  generateKeyPoints,
  generateGlossary,
  generateEli10,
  generateMindMap,
} from "@/server/ai/reading-room";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { materialId, tab, language = "en", regenerate = false } = body;

    if (!materialId || !tab) {
      return NextResponse.json(
        { error: "materialId and tab are required." },
        { status: 400 }
      );
    }

    const data = await getMaterialWithChunks(user.uid, materialId);
    if (!data) {
      return NextResponse.json({ error: "Material not found." }, { status: 404 });
    }

    const fullText = data.chunks.map((c) => c.text).join("\n\n");
    const lang = language === "mr" ? "mr" : "en";

    let result;
    switch (tab) {
      case "key_points":
        result = await generateKeyPoints({
          uid: user.uid,
          materialId,
          text: fullText,
          language: lang,
          regenerate: !!regenerate,
        });
        break;

      case "glossary":
        result = await generateGlossary({
          uid: user.uid,
          materialId,
          text: fullText,
          language: lang,
          regenerate: !!regenerate,
        });
        break;

      case "eli10":
        result = await generateEli10({
          uid: user.uid,
          materialId,
          text: fullText,
          language: lang,
          regenerate: !!regenerate,
        });
        break;

      case "mindmap":
        result = await generateMindMap({
          uid: user.uid,
          materialId,
          text: fullText,
          language: lang,
          regenerate: !!regenerate,
        });
        break;

      default:
        return NextResponse.json(
          { error: `Invalid tab: ${tab}. Expected key_points | glossary | eli10 | mindmap` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("Reading room content route error:", err);
    return NextResponse.json(
      { error: "Failed to generate tab content.", details: err?.message },
      { status: 500 }
    );
  }
}
