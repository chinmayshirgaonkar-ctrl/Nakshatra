import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user";
import { transcribeDocumentImage } from "@/server/ai/vision";
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
    const { image, languageHint } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Image data is required." }, { status: 400 });
    }

    const text = await transcribeDocumentImage({
      base64Data: image,
      languageHint: languageHint || "auto",
    });

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      text,
      wordCount,
    });
  } catch (err: any) {
    console.error("Vision transcription error:", err);
    return NextResponse.json(
      { error: "Failed to transcribe document.", details: err?.message },
      { status: 500 }
    );
  }
}
