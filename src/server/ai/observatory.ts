import { getGenAI, getLiteModel, withExponentialBackoff } from "./gemini";
import { AiCrossSubjectThreadSchema } from "@/server/db/schemas";
import { Concept, Subject, AiCrossSubjectThread } from "@/lib/types/models";

/**
 * Generates "A thread you didn't notice": an AI-found surprising, poetic
 * connection between two concepts from different subjects.
 */
export async function generateCrossSubjectThread({
  concepts,
  subjects,
}: {
  concepts: Concept[];
  subjects: Subject[];
}): Promise<AiCrossSubjectThread | null> {
  if (concepts.length < 2) return null;

  const subjectMap = new Map<string, string>();
  subjects.forEach((s) => subjectMap.set(s.id, s.name));

  // Partition concepts by subject
  const conceptsBySubject = new Map<string, Concept[]>();
  concepts.forEach((c) => {
    const subName = subjectMap.get(c.subjectId) || "General Studies";
    const list = conceptsBySubject.get(subName) || [];
    list.push(c);
    conceptsBySubject.set(subName, list);
  });

  const subjectNames = Array.from(conceptsBySubject.keys());
  let pool: { concept: Concept; subjectName: string }[] = [];

  if (subjectNames.length >= 2) {
    // Pick sample concepts across subjects
    for (const sub of subjectNames) {
      const list = conceptsBySubject.get(sub) || [];
      // Pick up to 5 concepts per subject
      list.slice(0, 5).forEach((concept) => {
        pool.push({ concept, subjectName: sub });
      });
    }
  } else {
    // Single subject fallback
    pool = concepts.slice(0, 10).map((c) => ({
      concept: c,
      subjectName: subjectMap.get(c.subjectId) || "General Studies",
    }));
  }

  const promptRoster = pool
    .map(
      (item) =>
        `[Subject: ${item.subjectName}] ${item.concept.name}: "${item.concept.definition.slice(0, 150)}"`
    )
    .join("\n");

  const ai = getGenAI();
  const model = getLiteModel();

  const systemInstruction = `You are the Celestial Synthesizer of "Nakshatra".
Your sacred role is to illuminate hidden bridges between disparate islands of human knowledge.
Task: Examine the concepts below and reveal "A Thread You Didn't Notice" — an unexpected, profound analogy, isomorphic law, or shared underlying dynamic between TWO concepts (ideally from DIFFERENT subjects/disciplines).
Explain it in EXACTLY TWO POETIC, CRYSTALLINE LINES that cause an intellectual spark in the reader.

Return JSON matching the schema.`;

  try {
    const result = await withExponentialBackoff(async () => {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Discover a hidden cross-subject thread between two of these concepts:\n\n${promptRoster}`,
              },
            ],
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              fromConcept: { type: "string" },
              fromSubject: { type: "string" },
              toConcept: { type: "string" },
              toSubject: { type: "string" },
              connection: { type: "string" },
              explanation: { type: "string" },
            },
            required: [
              "fromConcept",
              "fromSubject",
              "toConcept",
              "toSubject",
              "connection",
              "explanation",
            ],
          },
          temperature: 0.7,
        },
      });

      return response.text;
    });

    if (!result) return null;

    const parsed = JSON.parse(result);
    const validated = AiCrossSubjectThreadSchema.parse(parsed);
    return validated;
  } catch (err) {
    console.error("Failed to generate cross-subject thread:", err);
    return null;
  }
}
