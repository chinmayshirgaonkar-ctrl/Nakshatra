import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user";
import { getMaterialWithChunks } from "@/server/db/repository";
import { streamSummary, SummaryLength, getSummaryKind } from "@/server/ai/reading-room";
import { checkAiCache } from "@/server/ai/gemini";
import { checkAndIncrementAiUsage } from "@/server/ai/rate-limiter";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { materialId, length, regenerate = false } = body;

    if (!materialId || !length) {
      return NextResponse.json(
        { error: "materialId and length (1min | 5min | deep) are required." },
        { status: 400 }
      );
    }

    const kind = getSummaryKind(length as SummaryLength);

    // If cached and not regenerating, return cached summary directly
    if (!regenerate) {
      const cached = await checkAiCache(user.uid, materialId, kind, "en");
      if (cached && typeof cached === "string" && cached.trim()) {
        return NextResponse.json({ cached: true, text: cached });
      }
    }

    const quota = await checkAndIncrementAiUsage(user.uid);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Daily AI quota reached (${quota.count}/${quota.limit}). Resets at midnight UTC.` },
        { status: 429 }
      );
    }

    // Retrieve full text from material chunks
    const data = await getMaterialWithChunks(user.uid, materialId);
    if (!data) {
      return NextResponse.json({ error: "Material not found." }, { status: 404 });
    }

    const fullText = data.chunks.map((c) => c.text).join("\n\n");
    if (!fullText.trim()) {
      return NextResponse.json({ error: "Material has no text content." }, { status: 400 });
    }

    // Generate streaming response
    const stream = await streamSummary({
      uid: user.uid,
      materialId,
      text: fullText,
      length: length as SummaryLength,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err: any) {
    console.error("Summary stream route error:", err);
    return NextResponse.json(
      { error: "Failed to generate summary.", details: err?.message },
      { status: 500 }
    );
  }
}
