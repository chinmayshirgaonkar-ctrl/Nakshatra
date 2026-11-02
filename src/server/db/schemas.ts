import { z } from "zod";

export const FSRSCardSchema = z.object({
  due: z.string(),
  stability: z.number(),
  difficulty: z.number(),
  elapsedDays: z.number(),
  scheduledDays: z.number(),
  reps: z.number(),
  lapses: z.number(),
  state: z.number(),
  lastReview: z.string().nullable().optional(),
});

export const SubjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Subject name is required"),
  marathiName: z.string().optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Valid hex color required"),
  icon: z.string().default("BookOpen"),
  order: z.number().default(0),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export const TopicSchema = z.object({
  id: z.string().optional(),
  subjectId: z.string().min(1, "Subject ID is required"),
  name: z.string().min(1, "Topic name is required"),
  marathiName: z.string().optional(),
  examDate: z.string().nullable().optional(),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export const MaterialSchema = z.object({
  id: z.string().optional(),
  topicId: z.string().min(1, "Topic ID is required"),
  subjectId: z.string().min(1, "Subject ID is required"),
  title: z.string().min(1, "Material title is required"),
  sourceType: z.enum(["text", "pdf", "image", "url"]),
  sourceUrl: z.string().url().optional(),
  wordCount: z.number().min(0),
  chunkCount: z.number().min(1),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export const MaterialChunkSchema = z.object({
  id: z.string().optional(),
  order: z.number(),
  text: z.string(),
});

export const ConceptSchema = z.object({
  id: z.string().optional(),
  topicId: z.string(),
  subjectId: z.string(),
  materialId: z.string(),
  name: z.string().min(1),
  marathiName: z.string().optional(),
  definition: z.string().min(1),
  importance: z.number().min(1).max(5),
  fsrs: FSRSCardSchema,
  createdAt: z.string().default(() => new Date().toISOString()),
});

export const ConceptLinkSchema = z.object({
  id: z.string().optional(),
  fromConcept: z.string(),
  toConcept: z.string(),
  relationText: z.string(),
  strength: z.number().min(1).max(5).default(3),
  createdAt: z.string().default(() => new Date().toISOString()),
});

// Zod Schema for Gemini Concept Extraction Output
export const ExtractedConceptItemSchema = z.object({
  name: z.string().describe("Concept title (concise, 1-4 words)"),
  marathiName: z.string().optional().describe("Marathi translation of concept name if applicable"),
  definition: z.string().describe("Crystal clear explanation/definition (20-50 words)"),
  importance: z.number().min(1).max(5).describe("1=minor detail, 5=core foundational pillar"),
});

export const ExtractedRelationItemSchema = z.object({
  from: z.string().describe("Name of the starting concept"),
  to: z.string().describe("Name of the related concept (can be an existing concept from list)"),
  relationText: z.string().describe("How they relate (e.g., 'is a prerequisite for', 'counters', 'manifests through')"),
  strength: z.number().min(1).max(5).default(3).describe("Connection strength (1-5)"),
});

export const ExtractionResponseSchema = z.object({
  concepts: z.array(ExtractedConceptItemSchema).min(3).max(25),
  relations: z.array(ExtractedRelationItemSchema),
});

// Reading Room Schemas
export const KeyPointItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  number: z.number(),
  point: z.string(),
  supportingQuote: z.string().describe("Exact quote or near-verbatim supporting line from source text"),
  explanation: z.string().describe("Lucid explanation of this point and why it matters"),
});

export const KeyPointsResponseSchema = z.object({
  keyPoints: z.array(KeyPointItemSchema),
});

export const GlossaryItemSchema = z.object({
  term: z.string(),
  marathiTerm: z.string().optional(),
  definition: z.string(),
  context: z.string().optional(),
});

export const GlossaryResponseSchema = z.object({
  terms: z.array(GlossaryItemSchema),
});

export const Eli10AnalogySchema = z.object({
  title: z.string(),
  analogy: z.string(),
  takeaway: z.string(),
});

export const Eli10ResponseSchema = z.object({
  summary: z.string(),
  analogies: z.array(Eli10AnalogySchema),
});

export type MindMapNode = {
  name: string;
  description?: string;
  children?: MindMapNode[];
};

export const MindMapNodeSchema: z.ZodType<MindMapNode> = z.lazy(() =>
  z.object({
    name: z.string(),
    description: z.string().optional(),
    children: z.array(MindMapNodeSchema).optional(),
  })
);

export const MindMapResponseSchema = z.object({
  root: MindMapNodeSchema,
});

// Phase 4: Trials & Mistakes Schemas
export const MistakeExhibitSchema = z.object({
  id: z.string().optional(),
  question: z.string(),
  questionType: z.enum(["mcq", "true_false_why", "fill_blank", "short_answer"]),
  userAnswer: z.string(),
  correctAnswer: z.string(),
  whyWrong: z.string(),
  correctReasoning: z.string(),
  memoryHook: z.string(),
  conceptIds: z.array(z.string()),
  conceptNames: z.array(z.string()),
  topicId: z.string().optional(),
  subjectId: z.string().optional(),
  materialId: z.string().optional(),
  correctStreak: z.number().default(0),
  resolved: z.boolean().default(false),
  createdAt: z.string().default(() => new Date().toISOString()),
  lastTestedAt: z.string().default(() => new Date().toISOString()),
});

export const GeneratedQuestionItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  type: z.enum(["mcq", "true_false_why", "fill_blank", "short_answer"]),
  prompt: z.string().describe("Clear, thought-provoking problem statement or scenario testing deep understanding"),
  conceptIds: z.array(z.string()).describe("IDs of the concepts this question tests (from the provided list)"),
  conceptNames: z.array(z.string()).describe("Names of the concepts tested"),
  // MCQ
  options: z.array(z.string()).optional().describe("Exactly 4 plausible options for MCQ (distractors must target real misconceptions)"),
  correctOptionIndex: z.number().min(0).max(3).optional().describe("0-3 index of the correct option for MCQ"),
  // True / False
  statement: z.string().optional().describe("Assertion statement for true_false_why"),
  correctBool: z.boolean().optional().describe("True or false"),
  whyExplanation: z.string().optional().describe("Why the statement is true or false"),
  // Fill in the blank
  blankSentence: z.string().optional().describe("Sentence with '_____' for fill_blank"),
  acceptableAnswers: z.array(z.string()).optional().describe("List of acceptable lowercase exact words or phrases"),
  // Short Answer
  modelAnswer: z.string().optional().describe("Model answer for short_answer"),
  rubricKeywords: z.array(z.string()).optional().describe("Key mechanisms or terms that must be present"),
  // Universal
  explanation: z.string().describe("Masterful explanation detailing the core reasoning, counteracting misconceptions"),
});

export const QuizGenerationResponseSchema = z.object({
  questions: z.array(GeneratedQuestionItemSchema),
});

export const ShortAnswerGradingResponseSchema = z.object({
  score: z.number().min(0).max(3).describe("Integer 0 to 3 (3=masterful, 2=good grasp, 1=partial/vague, 0=misconception/incorrect)"),
  isCorrect: z.boolean().describe("true if score >= 2, false if score < 2"),
  whatWasGood: z.string().describe("1-2 sentences highlighting what the student grasped accurately"),
  whatWasMissing: z.string().describe("1-2 sentences on what was omitted or imprecise"),
  whyWrong: z.string().optional().describe("If score < 2, the exact misconception or reason it is inadequate"),
  correctReasoning: z.string().describe("The complete, lucid correct answer and explanation"),
  memoryHook: z.string().optional().describe("If score < 2, a 1-line celestial mnemonic hook to anchor memory"),
});

export const AiCrossSubjectThreadSchema = z.object({
  fromConcept: z.string().describe("Name of the first concept"),
  fromSubject: z.string().describe("Subject/discipline name of the first concept"),
  toConcept: z.string().describe("Name of the second concept (must be from a different subject if possible)"),
  toSubject: z.string().describe("Subject/discipline name of the second concept"),
  connection: z.string().describe("Title or phrase naming the conceptual bridge"),
  explanation: z.string().describe("Exactly 2 poetic, crystalline lines explaining the hidden connection between them"),
});

// ----------------- PHASE 6: DEEP LEARNING SCHEMAS -----------------

export const BlankPageEvaluationResponseSchema = z.object({
  score: z.number().min(0).max(100).describe("Overall recall score 0 to 100"),
  reflection: z.string().describe("Pedagogical synthesis of the user's mental model and recall fidelity"),
  remembered: z.array(
    z.object({
      conceptId: z.string().describe("Matching concept ID from the provided topic concepts"),
      conceptName: z.string().describe("Canonical concept name"),
      userExcerpt: z.string().describe("The exact snippet or sentence from user text demonstrating recall"),
      feedback: z.string().describe("Specific commendation on what was grasped accurately"),
    })
  ).describe("Concepts that were clearly and accurately recalled"),
  partiallyRemembered: z.array(
    z.object({
      conceptId: z.string().describe("Matching concept ID"),
      conceptName: z.string().describe("Canonical concept name"),
      userExcerpt: z.string().describe("The snippet from user text showing partial recall"),
      feedback: z.string().describe("What the user touched on"),
      missingDetails: z.string().describe("Key mechanisms, conditions, or properties omitted"),
    })
  ).describe("Concepts mentioned superficially or with critical missing nuances"),
  missed: z.array(
    z.object({
      conceptId: z.string().describe("Concept ID completely omitted"),
      conceptName: z.string().describe("Canonical concept name"),
      keyPrinciple: z.string().describe("1-2 sentence essence of this omitted concept"),
    })
  ).describe("Key topic concepts completely unmentioned in the recall text"),
  misconceptions: z.array(
    z.object({
      userExcerpt: z.string().describe("The user's statement containing the error"),
      misconceptionExplanation: z.string().describe("Why this statement is scientifically or logically flawed"),
      canonicalCorrection: z.string().describe("The precise, canonical correct understanding"),
    })
  ).describe("Any flawed assertions, false conflations, or misconceptions found in user text"),
});

export const ApprenticeDialogueResponseSchema = z.object({
  reply: z.string().describe("Curious, naive, smart question or intuitive observation from the apprentice. Asks for an example, asks why, or gently spots a contradiction. NEVER lectures."),
});

export const ApprenticeGapReportResponseSchema = z.object({
  feynmanScore: z.number().min(0).max(100).describe("Feynman teaching mastery score 0 to 100"),
  summary: z.string().describe("2-3 sentence overview of the teacher's clarity, simplicity, and grounding"),
  explainedWell: z.array(z.string()).describe("Concepts, analogies, or mechanics explained with great clarity and intuition"),
  unclear: z.array(z.string()).describe("Points that were murky, relied on unexplained jargon, or lacked concrete grounding"),
  gotWrong: z.array(z.string()).describe("Factual inaccuracies, false claims, or contradictions uttered by the teacher"),
  nextQuestions: z.array(z.string()).describe("Exactly 3 deep, provocative questions to study or explore next"),
});
