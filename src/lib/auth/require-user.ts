import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import { getServerEnv } from "@/lib/env";

export interface AuthenticatedUser {
  uid: string;
  email: string;
}

const SESSION_COOKIE_NAME = "__session";

export async function getSessionUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const env = getServerEnv();
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    if (decodedClaims.email !== env.ALLOWED_EMAIL) {
      return null;
    }

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || "",
    };
  } catch (error) {
    return null;
  }
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
