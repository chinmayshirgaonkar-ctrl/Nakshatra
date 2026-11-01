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
