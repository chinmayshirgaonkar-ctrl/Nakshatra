"use server";

import { requireUser } from "@/lib/auth/require-user";
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  reorderSubjects,
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  getMaterials,
  createMaterialWithChunks,
  deleteMaterial,
  getConcepts,
} from "@/server/db/repository";
import { chunkText } from "@/lib/text/chunker";
import { MaterialSourceType } from "@/lib/types/models";
import { revalidatePath } from "next/cache";

// ----------------- SUBJECTS -----------------
export async function getLibraryDataAction() {
  const user = await requireUser();
  const [subjects, topics, materials, concepts] = await Promise.all([
    getSubjects(user.uid),
    getTopics(user.uid),
    getMaterials(user.uid),
    getConcepts(user.uid),
  ]);

  return { subjects, topics, materials, concepts };
}

export async function createSubjectAction(formData: {
  name: string;
  marathiName?: string;
  color: string;
  icon: string;
}) {
  const user = await requireUser();
  const existing = await getSubjects(user.uid);
  const newSubject = await createSubject(user.uid, {
    name: formData.name.trim(),
    marathiName: formData.marathiName?.trim() || undefined,
    color: formData.color,
    icon: formData.icon || "BookOpen",
    order: existing.length,
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/library");
  return newSubject;
}

export async function updateSubjectAction(
  id: string,
  data: { name?: string; marathiName?: string; color?: string; icon?: string }
) {
  const user = await requireUser();
  await updateSubject(user.uid, id, data);
  revalidatePath("/library");
}

export async function deleteSubjectAction(id: string) {
  const user = await requireUser();
  await deleteSubject(user.uid, id);
  revalidatePath("/library");
}

export async function reorderSubjectsAction(orderedIds: string[]) {
  const user = await requireUser();
  await reorderSubjects(user.uid, orderedIds);
  revalidatePath("/library");
}

// ----------------- TOPICS -----------------
export async function createTopicAction(formData: {
  subjectId: string;
  name: string;
  marathiName?: string;
  examDate?: string | null;
}) {
  const user = await requireUser();
  const newTopic = await createTopic(user.uid, {
    subjectId: formData.subjectId,
    name: formData.name.trim(),
    marathiName: formData.marathiName?.trim() || undefined,
    examDate: formData.examDate || null,
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/library");
  return newTopic;
}

export async function updateTopicAction(
  id: string,
  data: { name?: string; marathiName?: string; examDate?: string | null }
) {
  const user = await requireUser();
  await updateTopic(user.uid, id, data);
  revalidatePath("/library");
}

export async function deleteTopicAction(id: string) {
  const user = await requireUser();
  await deleteTopic(user.uid, id);
  revalidatePath("/library");
}

// ----------------- MATERIALS -----------------
export async function createMaterialAction(data: {
  topicId: string;
  subjectId: string;
  title: string;
  sourceType: MaterialSourceType;
  sourceUrl?: string;
  rawText: string;
}) {
  const user = await requireUser();

  // Partition raw text into chunks of ~2,000 words
  const { chunks, wordCount } = chunkText(data.rawText, 2000);

  const { material } = await createMaterialWithChunks(
    user.uid,
    {
      topicId: data.topicId,
      subjectId: data.subjectId,
      title: data.title.trim(),
      sourceType: data.sourceType,
      sourceUrl: data.sourceUrl || undefined,
      wordCount,
      chunkCount: chunks.length,
      createdAt: new Date().toISOString(),
    },
    chunks
  );

  revalidatePath("/library");
  return { material, fullText: data.rawText };
}

export async function deleteMaterialAction(id: string) {
  const user = await requireUser();
  await deleteMaterial(user.uid, id);
  revalidatePath("/library");
}
