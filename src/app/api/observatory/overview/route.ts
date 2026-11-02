import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getObservatoryOverview } from "@/server/db/repository";

export const maxDuration = 60;

export async function GET() {
  try {
    const user = await requireUser();
    const data = await getObservatoryOverview(user.uid);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Observatory overview error:", error);
    if (error.message?.includes("Unauthorized") || error.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
