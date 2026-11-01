import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user";
import { getMistakes } from "@/server/db/repository";
import { buildQuestionsFromMistakes } from "@/server/ai/trials";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const unresolved = await getMistakes(user.uid, false);
    if (unresolved.length === 0) {
      return NextResponse.json(
        { error: "No unresolved mistakes in your museum gallery!" },
        { status: 400 }
      );
    }

    const questions = buildQuestionsFromMistakes(unresolved);
    return NextResponse.json({ success: true, questions });
  } catch (err: any) {
    console.error("Mistakes retrial error:", err);
    return NextResponse.json(
      { error: "Failed to generate mistake retrial." },
      { status: 500 }
    );
  }
}
