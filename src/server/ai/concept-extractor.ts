import { getGenAI, getLiteModel, withExponentialBackoff, checkAiCache, saveAiCache } from "./gemini";
import { ExtractionResponseSchema } from "@/server/db/schemas";
import { Concept, ConceptLink, FSRSCardData } from "@/lib/types/models";
import { createEmptyCard } from "ts-fsrs";

export interface ConceptExtractionInput {
  uid: string;
  materialId: string;
  topicId: string;
  subjectId: string;
  text: string;
  existingConcepts?: { id: string; name: string }[];
  language?: "en" | "mr";
  regenerate?: boolean;
}

export interface ConceptExtractionResult {
  concepts: Omit<Concept, "id">[];
  links: Omit<ConceptLink, "id">[];
}

export async function extractConceptsFromText({
  uid,
  materialId,
  topicId,
  subjectId,
  text,
  existingConcepts = [],
  language = "en",
  regenerate = false,
}: ConceptExtractionInput): Promise<ConceptExtractionResult> {
  // 1. Check Firestore AI cache if not regenerating
  if (!regenerate) {
    const cached = await checkAiCache(uid, materialId, "concept_extraction", language);
    if (cached && cached.concepts) {
      return cached;
    }
  }

  const ai = getGenAI();
  const modelName = getLiteModel();

  // Send only existing concept names to keep token usage low
  const existingConceptNames = existingConcepts
    .slice(0, 80) // cap to 80 names max for safety
    .map((c) => c.name)
    .join(", ");

  const systemInstruction = `You are the celestial cartographer of "Nakshatra" (नक्षत्र), an antique midnight observatory learning operating system.
Your mission is to chart the night sky by extracting 5 to 25 core foundational concepts (stars) from the provided study material, and mapping their relational lines (constellations).

GUIDELINES:
1. Extract between 5 and 25 distinct, essential concepts. Avoid superficial words; focus on testable, profound principles, laws, theorems, or mechanisms.
2. For each concept:
   - "name": Concise title (1-4 words).
   - "marathiName": Marathi equivalent/translation if possible (or empty string).
   - "definition": A lucid, precise summary explanation (25 to 50 words).
   - "importance": Integer from 1 to 5 (5 = cornerstone axiom, 1 = specialized facet).
3. "relations": Identify relationships between the new concepts:
   - "from": concept name
   - "to": concept name
   - "relationText": A vivid relational phrase (e.g., "is a prerequisite for", "directly contradicts", "instantiates", "emerges from")
   - "strength": Integer 1 to 5
4. CROSS-TOPIC LINKS:
   Here are concept names that already exist elsewhere in the user's constellation:
   [${existingConceptNames || "None yet"}]
   If any new concept strongly connects or parallels an existing concept from this list, create a relation entry with "to" set to that existing concept name!
5. ${language === "mr" ? "Provide definitions primarily in Marathi (मराठी) with English terms in parentheses." : "Provide definitions in English."}
6. Output format: You MUST return a single JSON object with two top-level keys:
   {
     "concepts": [
       { "name": "...", "marathiName": "...", "definition": "...", "importance": 1-5 }
     ],
     "relations": [
       { "from": "...", "to": "...", "relationText": "...", "strength": 1-5 }
     ]
   }`;

  const userPrompt = `MATERIAL TEXT:
${text.slice(0, 15000)} // Ensure under safe token ceiling`;

  const runCall = async () => {
    return await withExponentialBackoff(async () => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.2,
          responseSchema: {
            type: "OBJECT",
            properties: {
              concepts: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" },
                    marathiName: { type: "STRING" },
                    definition: { type: "STRING" },
                    importance: { type: "INTEGER" },
                  },
                  required: ["name", "definition", "importance"],
                },
              },
              relations: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    from: { type: "STRING" },
                    to: { type: "STRING" },
                    relationText: { type: "STRING" },
                    strength: { type: "INTEGER" },
                  },
                  required: ["from", "to", "relationText"],
                },
              },
            },
            required: ["concepts", "relations"],
          },
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);
      const normalized = {
        concepts: Array.isArray(parsed.concepts) ? parsed.concepts : Array.isArray(parsed) ? parsed : [],
        relations: Array.isArray(parsed.relations) ? parsed.relations : [],
      };
      return ExtractionResponseSchema.parse(normalized);
    });
  };

  let validatedData;
  try {
    validatedData = await runCall();
  } catch (firstErr) {
    console.warn("First concept extraction parse failed. Retrying once...", firstErr);
    // Retry once on failure
    validatedData = await runCall();
  }

  const nowIso = new Date().toISOString();

  // Initialize each concept with FSRS New state card
  const concepts: Omit<Concept, "id">[] = validatedData.concepts.map((c) => {
    const emptyCard = createEmptyCard();
    const fsrsData: FSRSCardData = {
      due: emptyCard.due.toISOString(),
      stability: emptyCard.stability,
      difficulty: emptyCard.difficulty,
      elapsedDays: emptyCard.elapsed_days,
      scheduledDays: emptyCard.scheduled_days,
      reps: emptyCard.reps,
      lapses: emptyCard.lapses,
      state: emptyCard.state, // 0 = New
      lastReview: null,
    };

    return {
      topicId,
      subjectId,
      materialId,
      name: c.name,
      marathiName: c.marathiName || undefined,
      definition: c.definition,
      importance: c.importance,
      fsrs: fsrsData,
      createdAt: nowIso,
    };
  });

  const links: Omit<ConceptLink, "id">[] = validatedData.relations.map((r) => ({
    fromConcept: r.from,
    toConcept: r.to,
    relationText: r.relationText,
    strength: r.strength || 3,
    createdAt: nowIso,
  }));

  const result: ConceptExtractionResult = { concepts, links };

  // Cache in Firestore
  await saveAiCache(uid, materialId, "concept_extraction", language, result, modelName);

  return result;
}
