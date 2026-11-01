import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user";
import { getConcepts } from "@/server/db/repository";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("materialId") || undefined;
    const topicId = searchParams.get("topicId") || undefined;

    const concepts = await getConcepts(user.uid, { materialId, topicId });
    return NextResponse.json({ success: true, concepts });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch concepts." },
      { status: 500 }
    );
  }
}
