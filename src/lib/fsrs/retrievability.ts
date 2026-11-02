import { Concept, FSRSCardData } from "@/lib/types/models";

/**
 * Calculates current memory retrievability R in [0.05, 1.0] using the FSRS forgetting curve.
 * Standard FSRS 5.0 formula:
 * R(t, S) = (1 + factor * t / (9 * S)) ^ decay
 * With factor = 19/9 and decay = -0.5:
 * R(t, S) = (1 + 19 * t / (81 * S)) ^ (-0.5)
 * When t = 0 -> R = 1.0 (100% retention)
 * When t = S -> R = (100/81)^(-0.5) = 9/10 = 0.90 (90% retention at stability interval)
 */
export function calculateConceptRetrievability(
  fsrsData: FSRSCardData | undefined,
  now: Date = new Date()
): number {
  if (!fsrsData) return 1.0;

  const nowMs = now.getTime();
  const dueMs = fsrsData.due ? new Date(fsrsData.due).getTime() : nowMs;

  // If card has never been reviewed
  if (!fsrsData.lastReview) {
    if (nowMs > dueMs) {
      const elapsedDays = Math.max(0, (nowMs - dueMs) / (1000 * 60 * 60 * 24));
      return Math.max(0.1, Math.min(1.0, Number((0.9 / (1 + 0.15 * elapsedDays)).toFixed(3))));
    }
    return 1.0;
  }

  const lastReviewMs = new Date(fsrsData.lastReview).getTime();
  const elapsedDays = Math.max(0, (nowMs - lastReviewMs) / (1000 * 60 * 60 * 24));
  const stability = Math.max(0.1, fsrsData.stability || 1.0);

  // FSRS power-law forgetting curve
  const r = Math.pow(1 + (19 * elapsedDays) / (81 * stability), -0.5);
  return Math.max(0.05, Math.min(1.0, Number(r.toFixed(3))));
}

/**
 * Determines whether a concept star is considered "fading" (needs review).
 * A star is fading if retrievability < 0.5 or its due date has passed.
 */
export function isConceptFading(
  concept: Concept,
  now: Date = new Date()
): boolean {
  if (!concept.fsrs) return false;
  const r = calculateConceptRetrievability(concept.fsrs, now);
  if (r < 0.5) return true;
  if (concept.fsrs.due && new Date(concept.fsrs.due).getTime() <= now.getTime()) {
    return true;
  }
  return false;
}
