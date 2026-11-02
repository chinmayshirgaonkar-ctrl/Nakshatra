import { getGenAI, getPrimaryModel, getLiteModel, withExponentialBackoff } from "./gemini";
import {
  QuizGenerationResponseSchema,
  ShortAnswerGradingResponseSchema,
} from "@/server/db/schemas";
import {
  Concept,
  TrialQuestion,
  QuestionType,
  TrialDifficulty,
  MistakeExhibit,
} from "@/lib/types/models";

export async function generateQuizQuestions({
  concepts,
  contextText = "",
  count = 5,
  difficulty = "honest",
  types = ["mcq", "true_false_why", "fill_blank", "short_answer"],
  language = "en",
}: {
  concepts: Concept[];
  contextText?: string;
  count?: number;
  difficulty?: TrialDifficulty;
  types?: QuestionType[];
  language?: string;
}): Promise<TrialQuestion[]> {
  if (concepts.length === 0) {
    throw new Error("No concepts available to generate questions from.");
  }

  const ai = getGenAI();
  const model = getPrimaryModel();

  // Prepare concepts roster with IDs
  const conceptsRoster = concepts.map((c) => ({
    id: c.id,
    name: c.name,
    definition: c.definition,
    importance: c.importance,
  }));

  const difficultyPrompt =
    difficulty === "gentle"
      ? "GENTLE: Clear, foundational principles, direct applications, intuitive wording. Fair distractors."
      : difficulty === "brutal"
      ? "BRUTAL: Devious edge-cases, common cognitive traps, subtle counter-intuitive mechanisms, rigorous multi-step deduction. Distractors must mirror pervasive expert errors."
      : "HONEST: Rigorous, realistic testing of deep comprehension, mechanism vs outcome, and practical scenarios. Plausible, non-trivial distractors.";

  const systemInstruction = `You are the High Grand Examiner of "Nakshatra", conducting the celestial Trials of intellect.
Your mission is to generate exactly ${count} profound evaluation questions based on the candidate concepts.

CRITICAL RULES:
1. Every question MUST carry the exact "conceptIds" it tests (chosen from the provided roster).
2. Avoid superficial trivia, date-memorization, or purely semantic matching. Test UNDERSTANDING, MECHANISMS, PRACTICAL APPLICATION, and COMMON MISCONCEPTIONS.
3. For "mcq": Exactly 4 options. Every incorrect distractor MUST be plausible, tempting, and rooted in a genuine student misunderstanding.
4. For "true_false_why": Provide an assertive statement, the correct boolean, and a concise "whyExplanation".
5. For "fill_blank": Provide a sentence containing "_____" where the blank represents an essential causal term or law, plus 1-3 acceptable lowercase variations.
6. For "short_answer": Ask the learner to explain an intricate mechanism or trade-off in their own words. Provide a definitive "modelAnswer" and 2-4 "rubricKeywords".
7. Allowed question types: [${types.join(", ")}]. Distribute types cleanly across the quiz.
8. Difficulty calibration: ${difficultyPrompt}
9. Language: Formulate in pristine English.

Output format: Return a JSON object matching this schema:
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "prompt": "...",
      "conceptIds": ["id1"],
      "conceptNames": ["Name 1"],
      "options": ["A", "B", "C", "D"],
      "correctOptionIndex": 1,
      "explanation": "..."
    }
  ]
}`;

  const userPrompt = `CANDIDATE CONCEPTS ROSTER:
${JSON.stringify(conceptsRoster, null, 2)}

SOURCE CONTEXT EXCERPTS:
${contextText.slice(0, 15000)}`;

  const result = await withExponentialBackoff(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: difficulty === "brutal" ? 0.35 : 0.25,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const normalized = {
      questions: Array.isArray(parsed.questions)
        ? parsed.questions
        : Array.isArray(parsed)
        ? parsed
        : [],
    };
    return QuizGenerationResponseSchema.parse(normalized);
  });

  return result.questions.map((q) => ({
    ...q,
    difficulty,
  }));
}

/**
 * Grade a short answer using Gemini with a 0-3 rubric
 */
export async function gradeShortAnswer({
  questionPrompt,
  modelAnswer = "",
  rubricKeywords = [],
  userAnswer,
  language = "en",
}: {
  questionPrompt: string;
  modelAnswer?: string;
  rubricKeywords?: string[];
  userAnswer: string;
  language?: string;
}) {
  const ai = getGenAI();
  const model = getLiteModel();

  const systemInstruction = `You are an exacting yet compassionate celestial tutor grading a student's answer in the Nakshatra Trials.
Grade the student's answer on a strict 0 to 3 scale:
- 3: Masterful — grasps the underlying principle, explains the causal chain accurately.
- 2: Good grasp — core answer is right, but minor detail or secondary nuance is missing. (Count as correct)
- 1: Partial / Vague — touches upon related ideas but misses the pivotal causal mechanism. (Count as incorrect)
- 0: Incorrect / Misconception — fundamentally flawed reasoning or blank. (Count as incorrect)

Output fields:
- "score": Integer 0 to 3
- "isCorrect": true if score >= 2, false otherwise
- "whatWasGood": 1-2 constructive sentences recognizing what they understood.
- "whatWasMissing": 1-2 lucid sentences on what was missing or incorrect.
- "whyWrong": (if score < 2) explain the exact misconception clearly.
- "correctReasoning": definitive explanation of the law/principle.
- "memoryHook": (if score < 2) a vivid 1-line celestial mnemonic hook to anchor retention.

Language: English.`;

  const userPrompt = `QUESTION:
${questionPrompt}

MODEL ANSWER:
${modelAnswer}

KEY RUBRIC CRITERIA:
${rubricKeywords.join(", ")}

STUDENT'S SUBMITTED ANSWER:
${userAnswer}`;

  const result = await withExponentialBackoff(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return ShortAnswerGradingResponseSchema.parse(parsed);
  });

  return result;
}

/**
 * Re-trials: Converts museum mistake exhibits into active trial questions
 */
export function buildQuestionsFromMistakes(mistakes: MistakeExhibit[]): TrialQuestion[] {
  return mistakes.map((m) => {
    if (m.questionType === "mcq") {
      // Re-create options with the correct answer and their prior wrong answer
      const options = [m.correctAnswer, m.userAnswer, "Neither mechanism applies here", "Both principles operate simultaneously"];
      // Shuffle options deterministically
      const shuffled = [...options].sort(() => 0.5 - Math.random());
      const correctIdx = shuffled.indexOf(m.correctAnswer);

      return {
        id: `mistake-${m.id}`,
        type: "mcq",
        prompt: m.question,
        conceptIds: m.conceptIds,
        conceptNames: m.conceptNames,
        difficulty: "honest",
        options: shuffled,
        correctOptionIndex: correctIdx >= 0 ? correctIdx : 0,
        explanation: `${m.correctReasoning}\n\n💡 Memory Hook: ${m.memoryHook}`,
        originalMistakeId: m.id,
      };
    }

    return {
      id: `mistake-${m.id}`,
      type: m.questionType,
      prompt: m.question,
      conceptIds: m.conceptIds,
      conceptNames: m.conceptNames,
      difficulty: "honest",
      modelAnswer: m.correctAnswer,
      explanation: `${m.correctReasoning}\n\n💡 Memory Hook: ${m.memoryHook}`,
      originalMistakeId: m.id,
    };
  });
}
