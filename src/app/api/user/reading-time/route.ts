import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user";
import { trackReadingTime } from "@/server/db/repository";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { materialId, seconds } = body;

    if (!materialId || typeof seconds !== "number" || seconds <= 0) {
      return NextResponse.json(
        { error: "materialId and valid positive seconds are required." },
        { status: 400 }
      );
    }

    // Cap single burst to 300 seconds (5 min) to prevent runaway timer bugs
    const safeSeconds = Math.min(seconds, 300);

    await trackReadingTime(user.uid, materialId, safeSeconds);

    return NextResponse.json({ success: true, loggedSeconds: safeSeconds });
  } catch (err: any) {
    console.error("Track reading time error:", err);
    return NextResponse.json(
      { error: "Failed to record reading time." },
      { status: 500 }
    );
  }
}
