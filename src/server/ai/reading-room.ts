import { getGenAI, getPrimaryModel, getLiteModel, withExponentialBackoff, checkAiCache, saveAiCache } from "./gemini";
import {
  KeyPointsResponseSchema,
  GlossaryResponseSchema,
  Eli10ResponseSchema,
  MindMapResponseSchema,
  MindMapNode,
} from "@/server/db/schemas";
import { Concept, FSRSCardData, Material } from "@/lib/types/models";
import { createEmptyCard } from "ts-fsrs";
import { createSingleConcept } from "@/server/db/repository";

export type SummaryLength = "1min" | "5min" | "deep";

export function getSummaryKind(length: SummaryLength) {
  switch (length) {
    case "1min":
      return "summary_1min";
    case "5min":
      return "summary_5min";
    case "deep":
      return "summary_deep";
  }
}

/**
 * Streams summary text from Gemini, while buffering the full text to cache into Firestore once finished.
 */
export async function streamSummary({
  uid,
  materialId,
  text,
  length,
  language = "en",
}: {
  uid: string;
  materialId: string;
  text: string;
  length: SummaryLength;
  language?: "en" | "mr";
}): Promise<ReadableStream<Uint8Array>> {
  const ai = getGenAI();
  const model = getPrimaryModel();
  const kind = getSummaryKind(length);

  let wordTarget = "100-150 words (tight, crystal essence)";
  let instructionDetails = "Give the 1-minute golden essence. Focus strictly on the single most crucial axiom and immediate takeaway.";
  if (length === "5min") {
    wordTarget = "450-600 words (structured, lucid breakdown)";
    instructionDetails = "Give a 5-minute deep overview with titled sections, key mechanics, foundational arguments, and clear implications.";
  } else if (length === "deep") {
    wordTarget = "1000-1500 words (masterclass comprehensive treatise)";
    instructionDetails = "Deliver a magazine-quality masterclass deep dive. Walk through the intellectual history, exact principles, step-by-step mechanics, subtleties, counterarguments, and profound practical synthesis.";
  }

  const systemInstruction = `You are the master scholar of "Nakshatra" (नक्षत्र), an antique midnight observatory learning sanctuary.
Your task is to write a distraction-free, magazine-quality ${length} summary of the provided text.

REQUIREMENTS:
- Word count: approximately ${wordTarget}.
- Style: ${instructionDetails}
- Tone: Elegant, lucid, intellectually exhilarating, beautifully formatted in Markdown (headings, italics, bullet points).
- Language: ${language === "mr" ? "Write fluently in Marathi (मराठी) using authentic vocabulary with English technical terms in brackets where helpful." : "Write in pristine English."}
- Do not repeat boilerplate; plunge straight into the ideas.`;

  const responseStream = await ai.models.generateContentStream({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: `TEXT TO SUMMARIZE:\n${text.slice(0, 25000)}` }],
      },
    ],
    config: {
      systemInstruction,
      temperature: 0.3,
    },
  });

  const encoder = new TextEncoder();
  let fullAccumulated = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of responseStream) {
          const chunkText = chunk.text || "";
          if (chunkText) {
            fullAccumulated += chunkText;
            controller.enqueue(encoder.encode(chunkText));
          }
        }
        controller.close();

        // Save complete streamed summary into Firestore cache
        if (fullAccumulated.trim()) {
          await saveAiCache(uid, materialId, kind, language, fullAccumulated, model);
        }
      } catch (err: any) {
        console.error("Stream summary error:", err);
        controller.error(err);
      }
    },
  });
}

/**
 * Generate numbered Key Points with expandable original-text citations
 */
export async function generateKeyPoints({
  uid,
  materialId,
  text,
  language = "en",
  regenerate = false,
}: {
  uid: string;
  materialId: string;
  text: string;
  language?: "en" | "mr";
  regenerate?: boolean;
}) {
  if (!regenerate) {
    const cached = await checkAiCache(uid, materialId, "key_points", language);
    if (cached) return cached;
  }

  const ai = getGenAI();
  const model = getLiteModel();

  const systemInstruction = `You are the celestial analyst of "Nakshatra".
Extract 5 to 10 numbered Key Points from the provided text.
For EACH point:
- "number": Integer (1, 2, 3...)
- "point": A bold, concise statement of the principle (1-2 sentences).
- "supportingQuote": The EXACT sentence or verbatim excerpt from the source text that proves this point.
- "explanation": Lucid 2-3 sentence commentary clarifying why this is pivotal.

Language: ${language === "mr" ? "Translate points and explanations into Marathi (मराठी), keeping the supportingQuote in original source language." : "Provide in English."}

Output format: Return JSON strictly conforming to:
{
  "keyPoints": [
    { "number": 1, "point": "...", "supportingQuote": "...", "explanation": "..." }
  ]
}`;

  const result = await withExponentialBackoff(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: text.slice(0, 20000) }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const normalized = {
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : Array.isArray(parsed) ? parsed : [],
    };
    return KeyPointsResponseSchema.parse(normalized);
  });

  await saveAiCache(uid, materialId, "key_points", language, result, model);
  return result;
}

/**
 * Generate crisp Glossary of terminology
 */
export async function generateGlossary({
  uid,
  materialId,
  text,
  language = "en",
  regenerate = false,
}: {
  uid: string;
  materialId: string;
  text: string;
  language?: "en" | "mr";
  regenerate?: boolean;
}) {
  if (!regenerate) {
    const cached = await checkAiCache(uid, materialId, "glossary", language);
    if (cached) return cached;
  }

  const ai = getGenAI();
  const model = getLiteModel();

  const systemInstruction = `You are the archivist of "Nakshatra".
Extract 8 to 18 essential technical or philosophical terms from the provided text.
For each term:
- "term": The term name (English)
- "marathiTerm": Marathi translation/transliteration (मराठी नाव)
- "definition": A razor-sharp, unambiguous 20-40 word definition.
- "context": Brief mention of how it is used in this specific text.

Language: ${language === "mr" ? "Provide definitions primarily in Marathi with English technical terms." : "Provide definitions in English."}

Output format: Return JSON strictly conforming to:
{
  "terms": [
    { "term": "...", "marathiTerm": "...", "definition": "...", "context": "..." }
  ]
}`;

  const result = await withExponentialBackoff(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: text.slice(0, 20000) }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const normalized = {
      terms: Array.isArray(parsed.terms) ? parsed.terms : Array.isArray(parsed) ? parsed : [],
    };
    return GlossaryResponseSchema.parse(normalized);
  });

  await saveAiCache(uid, materialId, "glossary", language, result, model);
  return result;
}

/**
 * Generate "Explain Like I'm 10" (ELI10)
 */
export async function generateEli10({
  uid,
  materialId,
  text,
  language = "en",
  regenerate = false,
}: {
  uid: string;
  materialId: string;
  text: string;
  language?: "en" | "mr";
  regenerate?: boolean;
}) {
  if (!regenerate) {
    const cached = await checkAiCache(uid, materialId, "eli10", language);
    if (cached) return cached;
  }

  const ai = getGenAI();
  const model = getLiteModel();

  const systemInstruction = `You are the master storyteller of "Nakshatra".
Explain this complex material as if talking to a curious 10-year-old child.
Use zero jargon, vivid everyday analogies (like tree houses, lego bricks, rollercoasters, bicycle gears, cosmic playgrounds), and boundless wonder.

Structure:
- "summary": A 3-paragraph enchanting overview of the big picture.
- "analogies": 3 to 5 specific analogy spotlights:
  - "title": Catchy title (e.g. "The Cosmic Trampoline")
  - "analogy": The vivid story or metaphor explaining a tricky mechanism.
  - "takeaway": One simple sentence the child will remember forever.

Language: ${language === "mr" ? "Write in warm, captivating Marathi (मराठी)." : "Write in engaging English."}

Output format: Return JSON strictly conforming to:
{
  "summary": "...",
  "analogies": [
    { "title": "...", "analogy": "...", "takeaway": "..." }
  ]
}`;

  const result = await withExponentialBackoff(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: text.slice(0, 20000) }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return Eli10ResponseSchema.parse(parsed);
  });

  await saveAiCache(uid, materialId, "eli10", language, result, model);
  return result;
}

/**
 * Generate Mind Map hierarchical JSON tree
 */
export async function generateMindMap({
  uid,
  materialId,
  text,
  language = "en",
  regenerate = false,
}: {
  uid: string;
  materialId: string;
  text: string;
  language?: "en" | "mr";
  regenerate?: boolean;
}) {
  if (!regenerate) {
    const cached = await checkAiCache(uid, materialId, "mindmap", language);
    if (cached) return cached;
  }

  const ai = getGenAI();
  const model = getLiteModel();

  const systemInstruction = `You are the celestial radial cartographer of "Nakshatra".
Generate a balanced, hierarchical mind map tree from this material.
Requirements:
1. Root node: Core theme of the text (1-3 words).
2. Primary branches: 4 to 6 foundational branches (major sections or axioms).
3. Secondary sub-branches: 2 to 4 specific sub-nodes under each primary branch.
4. Each node must have "name" (concise, 1-3 words) and optional "description" (1 short sentence).
5. Max depth: 3 levels (Root -> Branches -> Sub-branches).

Language: ${language === "mr" ? "Provide labels in Marathi (मराठी) with English in parentheses if needed." : "Provide in English."}

Output format: Return JSON strictly conforming to:
{
  "root": {
    "name": "...",
    "description": "...",
    "children": [
      {
        "name": "...",
        "description": "...",
        "children": [
          { "name": "...", "description": "..." }
        ]
      }
    ]
  }
}`;

  const result = await withExponentialBackoff(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: text.slice(0, 20000) }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return MindMapResponseSchema.parse(parsed);
  });

  await saveAiCache(uid, materialId, "mindmap", language, result, model);
  return result;
}

/**
 * Selection Tool 1: "Explain this"
 */
export async function explainSelection({
  selection,
  surroundingContext,
  language = "en",
}: {
  selection: string;
  surroundingContext?: string;
  language?: "en" | "mr";
}) {
  const ai = getGenAI();
  const model = getLiteModel();

  const systemInstruction = `You are the wise astronomical tutor of Nakshatra.
Provide a crystal-clear, illuminating 2-3 sentence explanation of the selected phrase in context, followed by an intuitive mental model or metaphor.
Language: ${language === "mr" ? "मराठी (Marathi)" : "English"}.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `SELECTED TEXT:\n"${selection}"\n\nCONTEXT:\n"${surroundingContext || ""}"`,
          },
        ],
      },
    ],
    config: { systemInstruction, temperature: 0.3 },
  });

  return response.text || "Could not generate explanation.";
}

/**
 * Selection Tool 2: "Make a concept star"
 */
export async function makeStarFromSelection({
  uid,
  material,
  selection,
  language = "en",
}: {
  uid: string;
  material: Material;
  selection: string;
  language?: "en" | "mr";
}): Promise<Concept> {
  const ai = getGenAI();
  const model = getLiteModel();

  const systemInstruction = `From the selected passage, distill:
1. "name": Concise concept title (1-4 words).
2. "marathiName": Marathi equivalent if possible.
3. "definition": A rigorous, lucid definition (20-40 words).
4. "importance": Integer from 1 to 5.

Output JSON: { "name": "...", "marathiName": "...", "definition": "...", "importance": 4 }`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: `SELECTED TEXT:\n"${selection}"` }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const parsed = JSON.parse(response.text || "{}");
  const emptyCard = createEmptyCard();
  const fsrsData: FSRSCardData = {
    due: emptyCard.due.toISOString(),
    stability: emptyCard.stability,
    difficulty: emptyCard.difficulty,
    elapsedDays: emptyCard.elapsed_days,
    scheduledDays: emptyCard.scheduled_days,
    reps: emptyCard.reps,
    lapses: emptyCard.lapses,
    state: emptyCard.state,
    lastReview: null,
  };

  const newConcept = await createSingleConcept(uid, {
    topicId: material.topicId,
    subjectId: material.subjectId,
    materialId: material.id,
    name: parsed.name || selection.slice(0, 30),
    marathiName: parsed.marathiName || undefined,
    definition: parsed.definition || selection,
    importance: parsed.importance || 3,
    fsrs: fsrsData,
    createdAt: new Date().toISOString(),
  });

  return newConcept;
}

/**
 * Selection Tool 3: "Quiz me on this"
 */
export async function quizSelection({
  selection,
  surroundingContext,
  language = "en",
}: {
  selection: string;
  surroundingContext?: string;
  language?: "en" | "mr";
}) {
  const ai = getGenAI();
  const model = getLiteModel();

  const systemInstruction = `You are the examiner in the Nakshatra Trials.
Formulate one probing active-recall question testing understanding of the selected concept.
Format JSON:
{
  "question": "Clear, thought-provoking question (not just rote repetition)",
  "answer": "Definitive, concise model answer (2-3 sentences)",
  "hint": "Subtle clue pointing toward the right mechanism"
}
Language: ${language === "mr" ? "मराठी (Marathi)" : "English"}.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `SELECTED TEXT:\n"${selection}"\n\nCONTEXT:\n"${surroundingContext || ""}"`,
          },
        ],
      },
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  return JSON.parse(response.text || "{}");
}
