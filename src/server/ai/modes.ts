import { getGenAI, getPrimaryModel, getLiteModel, withExponentialBackoff } from "./gemini";
import {
  BlankPageEvaluationResponseSchema,
  ApprenticeGapReportResponseSchema,
} from "@/server/db/schemas";
import {
  Concept,
  Topic,
  BlankPageEvaluation,
  ApprenticeGapReport,
} from "@/lib/types/models";

/**
 * Evaluates unassisted active-recall text written on the Blank Page.
 */
export async function evaluateBlankPageRecall({
  recallText,
  topic,
  concepts,
  sourceContext = "",
  language = "en",
}: {
  recallText: string;
  topic: Topic;
  concepts: Concept[];
  sourceContext?: string;
  language?: string;
}): Promise<BlankPageEvaluation> {
  const ai = getGenAI();
  const model = getPrimaryModel();

  const conceptsRoster = concepts.map((c) => ({
    id: c.id,
    name: c.name,
    definition: c.definition,
    importance: c.importance,
  }));

  const systemInstruction = `You are the High Grand Assessor of "Nakshatra", evaluating an unassisted active-recall manuscript written on the "Blank Page".
The learner attempted to reconstruct the core concepts and mechanisms of topic "${topic.name}" from unassisted memory.

TARGET CONCEPTS ROSTER:
${JSON.stringify(conceptsRoster, null, 2)}

${sourceContext ? `REFERENCE SOURCE TEXT CONTEXT:\n${sourceContext.slice(0, 3000)}\n` : ""}

CRITICAL EVALUATION GUIDELINES:
1. "remembered": Concepts from the roster that the learner recalled with accurate causal understanding. You MUST extract the exact matching phrase or sentence from the user's text into "userExcerpt".
2. "partiallyRemembered": Concepts mentioned superficially, loosely, or where crucial mechanisms/nuances were omitted. You MUST include "missingDetails" specifying what was missing.
3. "missed": Concepts from the roster that were completely absent from the recall text. Provide a crisp 1-2 sentence "keyPrinciple".
4. "misconceptions": Factual errors, flawed deductions, or false claims found in the user's text. You MUST extract "userExcerpt", explain the misconception, and provide the canonical correction.
5. "score": Integer 0 to 100 reflecting the depth, accuracy, and breadth of retrieval.
6. "reflection": 2-3 sentences offering profound, constructive pedagogical feedback on their mental model.
7. Language: Output explanations and feedback in English.

Return JSON matching the schema.`;

  const prompt = `Here is the learner's unassisted recall manuscript:\n\n"""\n${recallText}\n"""\n\nEvaluate the recall against the canonical concepts.`;

  const result = await withExponentialBackoff(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: { type: "integer" },
            reflection: { type: "string" },
            remembered: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  conceptId: { type: "string" },
                  conceptName: { type: "string" },
                  userExcerpt: { type: "string" },
                  feedback: { type: "string" },
                },
                required: ["conceptId", "conceptName", "userExcerpt", "feedback"],
              },
            },
            partiallyRemembered: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  conceptId: { type: "string" },
                  conceptName: { type: "string" },
                  userExcerpt: { type: "string" },
                  feedback: { type: "string" },
                  missingDetails: { type: "string" },
                },
                required: ["conceptId", "conceptName", "userExcerpt", "feedback", "missingDetails"],
              },
            },
            missed: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  conceptId: { type: "string" },
                  conceptName: { type: "string" },
                  keyPrinciple: { type: "string" },
                },
                required: ["conceptId", "conceptName", "keyPrinciple"],
              },
            },
            misconceptions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  userExcerpt: { type: "string" },
                  misconceptionExplanation: { type: "string" },
                  canonicalCorrection: { type: "string" },
                },
                required: ["userExcerpt", "misconceptionExplanation", "canonicalCorrection"],
              },
            },
          },
          required: ["score", "reflection", "remembered", "partiallyRemembered", "missed", "misconceptions"],
        },
        temperature: 0.2,
      },
    });

    return response.text;
  });

  if (!result) {
    throw new Error("Failed to receive evaluation from Gemini.");
  }

  const parsed = JSON.parse(result);
  return BlankPageEvaluationResponseSchema.parse(parsed);
}

/**
 * Generates the Apprentice's next conversational response during Feynman teaching.
 */
export async function generateApprenticeReply({
  concept,
  canonicalText = "",
  conversationHistory,
  language = "en",
}: {
  concept: Concept;
  canonicalText?: string;
  conversationHistory: { role: "user" | "apprentice"; text: string }[];
  language?: string;
}): Promise<string> {
  const ai = getGenAI();
  const model = getLiteModel();

  const systemInstruction = `You are the Apprentice in "Nakshatra", an ancient-modern celestial learning academy.
You are practicing the Feynman Technique: the user is your Master / Teacher, and you are their eager, intellectually curious student who knows NOTHING about this topic.
The concept being taught is: "${concept.name}".
CANONICAL DEFINITION FOR YOUR REFERENCE (DO NOT RECITE):
"${concept.definition}"
${canonicalText ? `SOURCE CONTEXT: ${canonicalText.slice(0, 1500)}` : ""}

STRICT PERSONA RULES:
1. NEVER LECTURE. You are NOT the teacher. You must NEVER explain the concept or provide textbook answers.
2. BE INQUISITIVE & HUMBLE: Respond in 1 to 3 sentences. React to what the teacher said with genuine curiosity.
3. ASK FOR EXAMPLES: If the explanation is abstract, ask for an everyday metaphor or real-world example ("Master, how can I picture this in everyday life?").
4. SPOT HOLES: If the teacher gives a vague or circular explanation, gently ask what a specific term actually means in simple words.
5. SPOT CONTRADICTIONS: If the teacher says something that contradicts the canonical definition or their own earlier words, naively point out the paradox ("Wait, earlier you said X... but if that's true, wouldn't Y happen? How do those two connect?").
6. LANGUAGE: Always respond in respectful, curious English.`;

  // Ensure Gemini contents alternate properly and begin with a "user" turn
  const filteredHistory =
    conversationHistory[0]?.role === "apprentice"
      ? conversationHistory.slice(1)
      : conversationHistory;

  let contents = filteredHistory.map((msg) => ({
    role: msg.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: msg.text }],
  }));

  if (contents.length === 0) {
    contents = [{ role: "user", parts: [{ text: "Hello apprentice, let us begin our lesson." }] }];
  }

  const result = await withExponentialBackoff(async () => {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    return response.text;
  });

  return result?.trim() || "Could not understand, Master. Could you explain that part a bit more simply?";
}

/**
 * Generates the Feynman Gap Report after an Apprentice lesson ends.
 */
export async function generateApprenticeGapReport({
  concept,
  conversationHistory,
  language = "en",
}: {
  concept: Concept;
  conversationHistory: { role: "user" | "apprentice"; text: string }[];
  language?: string;
}): Promise<ApprenticeGapReport> {
  const ai = getGenAI();
  const model = getPrimaryModel();

  const transcript = conversationHistory
    .map((m) => `${m.role === "user" ? "TEACHER" : "APPRENTICE"}: ${m.text}`)
    .join("\n\n");

  const systemInstruction = `You are the High Chancellor of the Feynman Academy in "Nakshatra".
Analyze the following teaching dialogue where a user attempted to teach the concept "${concept.name}" to their apprentice.
CANONICAL CONCEPT PRINCIPLE:
"${concept.definition}"

EVALUATE THE TEACHING FIDELITY:
1. "explainedWell": What did the teacher explain intuitively, accurately, and with lucid analogies?
2. "unclear": What parts were hand-wavy, vague, or relied on unexplained jargon without grounding?
3. "gotWrong": Any factual mistakes, false claims, or contradictions the teacher made during the lesson.
4. "nextQuestions": EXACTLY 3 profound questions the learner should contemplate next to achieve complete mastery.
5. "feynmanScore": Integer 0 to 100 based on clarity, simplicity, depth, and pedagogical skill.
6. "summary": 2-3 sentences synthesizing the learner's true mastery of this concept.
7. Language: English.

Return JSON matching the schema.`;

  const result = await withExponentialBackoff(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: `DIALOGUE TRANSCRIPT:\n\n${transcript}` }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            feynmanScore: { type: "integer" },
            summary: { type: "string" },
            explainedWell: { type: "array", items: { type: "string" } },
            unclear: { type: "array", items: { type: "string" } },
            gotWrong: { type: "array", items: { type: "string" } },
            nextQuestions: { type: "array", items: { type: "string" } },
          },
          required: ["feynmanScore", "summary", "explainedWell", "unclear", "gotWrong", "nextQuestions"],
        },
        temperature: 0.3,
      },
    });

    return response.text;
  });

  if (!result) {
    throw new Error("Failed to generate Feynman Gap Report.");
  }

  const parsed = JSON.parse(result);
  return ApprenticeGapReportResponseSchema.parse(parsed);
}
