import { State } from "ts-fsrs";

export interface FSRSCardData {
  due: string; // ISO date string
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: State;
  lastReview: string | null;
}

export interface Subject {
  id: string;
  name: string;
  marathiName?: string;
  color: string; // Hex color for book spine & star group
  icon: string; // Lucide icon identifier
  order: number;
  createdAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  marathiName?: string;
  examDate?: string | null;
  createdAt: string;
}

export type MaterialSourceType = "text" | "pdf" | "image" | "url";

export interface Material {
  id: string;
  topicId: string;
  subjectId: string;
  title: string;
  sourceType: MaterialSourceType;
  sourceUrl?: string;
  wordCount: number;
  chunkCount: number;
  createdAt: string;
}

export interface MaterialChunk {
  id: string;
  materialId: string;
  order: number;
  text: string;
}

export interface Concept {
  id: string;
  topicId: string;
  subjectId: string;
  materialId: string;
  name: string;
  marathiName?: string;
  definition: string;
  importance: number; // 1 to 5
  fsrs: FSRSCardData;
  createdAt: string;
}

export interface ConceptLink {
  id: string;
  fromConcept: string; // conceptId or name
  toConcept: string; // conceptId or name
  relationText: string;
  strength: number; // 1 to 5
  createdAt: string;
}

export type AiOutputKind =
  | "summary_1min"
  | "summary_5min"
  | "summary_deep"
  | "key_points"
  | "glossary"
  | "eli10"
  | "mindmap"
  | "concept_extraction";

export interface AiOutput {
  id: string;
  materialId: string;
  kind: AiOutputKind;
  language: "en" | "mr";
  content: any; // JSON structured payload
  model: string;
  createdAt: string;
}

// ----------------- PHASE 4: TRIALS & MISTAKES -----------------
export type QuestionType = "mcq" | "true_false_why" | "fill_blank" | "short_answer";
export type TrialDifficulty = "gentle" | "honest" | "brutal";
export type ConfidenceLevel = "sure" | "think_so" | "guessing";

export interface TrialQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  conceptIds: string[];
  conceptNames: string[];
  difficulty: TrialDifficulty;
  // For MCQ
  options?: string[];
  correctOptionIndex?: number;
  // For True/False + Why
  statement?: string;
  correctBool?: boolean;
  whyExplanation?: string;
  // For Fill-in-the-blank
  blankSentence?: string; // Sentence with '_____'
  acceptableAnswers?: string[];
  // For Short Answer
  modelAnswer?: string;
  rubricKeywords?: string[];
  // Universal
  explanation: string;
  // If re-trial from mistake
  originalMistakeId?: string;
}

export interface MistakeExhibit {
  id: string;
  question: string;
  questionType: QuestionType;
  userAnswer: string;
  correctAnswer: string;
  whyWrong: string;
  correctReasoning: string;
  memoryHook: string;
  conceptIds: string[];
  conceptNames: string[];
  topicId?: string;
  subjectId?: string;
  materialId?: string;
  correctStreak: number; // 0, 1, 2
  resolved: boolean; // true when correctStreak >= 2
  createdAt: string;
  lastTestedAt: string;
}

export interface ConceptFSRSChange {
  conceptId: string;
  conceptName: string;
  oldStability: number;
  newStability: number;
  oldDue: string;
  newDue: string;
  rating: number; // 1-4 (Again, Hard, Good, Easy)
  improved: boolean;
}

export interface TrialSessionResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  durationSeconds: number;
  strengthened: ConceptFSRSChange[];
  weakened: ConceptFSRSChange[];
  newMistakesCount: number;
  resolvedMistakesCount: number;
}
