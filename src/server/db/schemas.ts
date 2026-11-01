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
