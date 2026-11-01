import { GoogleGenAI } from "@google/genai";
import { adminDb } from "@/lib/firebase/admin";
import { AiOutput } from "@/lib/types/models";
import { getServerEnv } from "@/lib/env";

let genAiClient: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  if (!genAiClient) {
    const env = getServerEnv();
    genAiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return genAiClient;
}

export function getPrimaryModel(): string {
  return getServerEnv().GEMINI_MODEL;
}

export function getLiteModel(): string {
  return getServerEnv().GEMINI_MODEL_LITE;
}

/**
 * Exponential backoff wrapper with jitter for rate limits (429)
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 1500
): Promise<T> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const isRateLimit =
        error?.status === 429 ||
        error?.message?.includes("429") ||
        error?.message?.includes("RESOURCE_EXHAUSTED");

      if (attempt > maxRetries || !isRateLimit) {
        throw error;
      }

      // Add jitter: ±20%
      const jitter = delay * 0.2 * (Math.random() * 2 - 1);
      const sleepTime = Math.max(500, Math.floor(delay + jitter));
      console.warn(`[Gemini Rate Limit 429] Retrying attempt ${attempt}/${maxRetries} in ${sleepTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, sleepTime));
      delay *= 2;
    }
  }
}

/**
 * Cache AI results to avoid redundant calls for the same material + task + language
 */
export async function checkAiCache(
  uid: string,
  materialId: string,
  kind: string,
  language: "en" | "mr"
): Promise<any | null> {
  try {
    const cacheKey = `${materialId}_${kind}_${language}`;
    const docRef = adminDb.doc(`users/${uid}/aiOutputs/${cacheKey}`);
    const doc = await docRef.get();
    if (doc.exists) {
      return doc.data()?.content || null;
    }
  } catch (err) {
    // Fail soft on cache read
  }
  return null;
}

export async function saveAiCache(
  uid: string,
  materialId: string,
  kind: string,
  language: "en" | "mr",
  content: any,
  model: string
): Promise<void> {
  try {
    const cacheKey = `${materialId}_${kind}_${language}`;
    const docRef = adminDb.doc(`users/${uid}/aiOutputs/${cacheKey}`);
    await docRef.set({
      materialId,
      kind,
      language,
      content,
      model,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    // Fail soft on cache write
  }
}
