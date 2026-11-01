import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getServerEnv } from "@/lib/env";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "__session";
const EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { error: "Missing identity token." },
        { status: 400 }
      );
    }

    const env = getServerEnv();

    // 1. Cryptographically verify the Google ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // 2. Strict single-user lock: email must equal ALLOWED_EMAIL
    if (decodedToken.email !== env.ALLOWED_EMAIL) {
      return NextResponse.json(
        {
          error: "Unauthorized: This observatory is locked to its registered astronomer.",
          email: decodedToken.email,
        },
        { status: 403 }
      );
    }

    // 3. Generate secure Firebase session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: EXPIRES_IN_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: EXPIRES_IN_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
      },
    });
  } catch (error: any) {
    console.error("Session creation failed:", error);
    return NextResponse.json(
      { error: "Authentication failed", details: error?.message },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ success: true, message: "Logged out." });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to clear session", details: error?.message },
      { status: 500 }
    );
  }
}
