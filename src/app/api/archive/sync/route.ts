import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { syncMaterialChunksEmbeddings } from "@/server/db/repository";

export const maxDuration = 60;

export async function POST() {
  try {
    const user = await requireUser();
    const result = await syncMaterialChunksEmbeddings(user.uid);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Archive Sync API error:", error);
    if (error.message?.includes("Unauthorized") || error.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to sync archive vectors." },
      { status: 500 }
    );
  }
}
