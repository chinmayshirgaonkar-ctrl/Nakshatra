import { adminDb } from "@/lib/firebase/admin";
import { getServerEnv } from "@/lib/env";

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
}

/**
 * Enforces the DAILY_AI_CALL_LIMIT per user via an atomic counter in Firestore.
 * Document: users/{uid}/system/dailyAiUsage
 * Resets automatically each day at 00:00 UTC.
 */
export async function checkAndIncrementAiUsage(uid: string): Promise<RateLimitResult> {
  const env = getServerEnv();
  const limit = env.DAILY_AI_CALL_LIMIT;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const docRef = adminDb.doc(`users/${uid}/system/dailyAiUsage`);

  return await adminDb.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);
    const data = doc.data();

    let count = 0;
    if (doc.exists && data && data.date === today) {
      count = Number(data.callCount) || 0;
    }

    if (count >= limit) {
      return {
        allowed: false,
        count,
        limit,
        remaining: 0,
      };
    }

    const nextCount = count + 1;
    transaction.set(
      docRef,
      {
        date: today,
        callCount: nextCount,
        lastCallTimestamp: new Date().toISOString(),
      },
      { merge: true }
    );

    return {
      allowed: true,
      count: nextCount,
      limit,
      remaining: Math.max(0, limit - nextCount),
    };
  });
}
