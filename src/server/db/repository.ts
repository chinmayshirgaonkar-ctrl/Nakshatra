import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { embedBatch } from "@/server/ai/embeddings";
import {
  Subject,
  Topic,
  Material,
  MaterialChunk,
  Concept,
  ConceptLink,
  MistakeExhibit,
  ConceptFSRSChange,
  FSRSCardData,
  ObservatoryOverviewData,
  ObservatoryWeeklyDay,
  ExamCountdownItem,
  AiCrossSubjectThread,
  BlankPageSession,
  BlankPageEvaluation,
  ApprenticeLesson,
  ApprenticeGapReport,
} from "@/lib/types/models";
import { fsrs, Rating, Card, State } from "ts-fsrs";
import { calculateConceptRetrievability, isConceptFading } from "@/lib/fsrs/retrievability";
import { generatePast30DaysMoonPhases } from "@/lib/astronomy/moon";
import { generateCrossSubjectThread } from "@/server/ai/observatory";

// ----------------- SUBJECTS -----------------
export async function getSubjects(uid: string): Promise<Subject[]> {
  const snapshot = await adminDb
    .collection(`users/${uid}/subjects`)
    .orderBy("order", "asc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Subject, "id">),
  }));
}

export async function createSubject(
  uid: string,
  data: Omit<Subject, "id">
): Promise<Subject> {
  const ref = adminDb.collection(`users/${uid}/subjects`).doc();
  await ref.set(data);
  return {
    id: ref.id,
    ...data,
  };
}

export async function updateSubject(
  uid: string,
  id: string,
  data: Partial<Subject>
): Promise<void> {
  await adminDb.doc(`users/${uid}/subjects/${id}`).update(data);
}

export async function deleteSubject(uid: string, id: string): Promise<void> {
  await adminDb.doc(`users/${uid}/subjects/${id}`).delete();
}

export async function reorderSubjects(
  uid: string,
  orderedIds: string[]
): Promise<void> {
  const batch = adminDb.batch();
  orderedIds.forEach((id, index) => {
    const ref = adminDb.doc(`users/${uid}/subjects/${id}`);
    batch.update(ref, { order: index });
  });
  await batch.commit();
}

// ----------------- TOPICS -----------------
export async function getTopics(
  uid: string,
  subjectId?: string
): Promise<Topic[]> {
  let query: FirebaseFirestore.Query = adminDb.collection(`users/${uid}/topics`);
  if (subjectId) {
    query = query.where("subjectId", "==", subjectId);
  }
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Topic, "id">),
  }));
}

export async function createTopic(
  uid: string,
  data: Omit<Topic, "id">
): Promise<Topic> {
  const ref = adminDb.collection(`users/${uid}/topics`).doc();
  await ref.set(data);
  return {
    id: ref.id,
    ...data,
  };
}

export async function updateTopic(
  uid: string,
  id: string,
  data: Partial<Topic>
): Promise<void> {
  await adminDb.doc(`users/${uid}/topics/${id}`).update(data);
}

export async function deleteTopic(uid: string, id: string): Promise<void> {
  await adminDb.doc(`users/${uid}/topics/${id}`).delete();
}

// ----------------- MATERIALS & CHUNKS -----------------
export async function getMaterials(
  uid: string,
  topicId?: string
): Promise<Material[]> {
  let query: FirebaseFirestore.Query = adminDb
    .collection(`users/${uid}/materials`)
    .orderBy("createdAt", "desc");
  if (topicId) {
    query = query.where("topicId", "==", topicId);
  }
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Material, "id">),
  }));
}

export async function getMaterialWithChunks(
  uid: string,
  materialId: string
): Promise<{ material: Material; chunks: MaterialChunk[] } | null> {
  const matDoc = await adminDb.doc(`users/${uid}/materials/${materialId}`).get();
  if (!matDoc.exists) return null;

  const material = {
    id: matDoc.id,
    ...(matDoc.data() as Omit<Material, "id">),
  };

  const chunkSnapshot = await adminDb
    .collection(`users/${uid}/materials/${materialId}/chunks`)
    .orderBy("order", "asc")
    .get();

  const chunks = chunkSnapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<MaterialChunk, "id">),
  }));

  return { material, chunks };
}

export async function createMaterialWithChunks(
  uid: string,
  materialData: Omit<Material, "id">,
  chunkTexts: string[]
): Promise<{ material: Material; chunks: MaterialChunk[] }> {
  const matRef = adminDb.collection(`users/${uid}/materials`).doc();
  const materialId = matRef.id;

  const material: Material = {
    id: materialId,
    ...materialData,
    chunkCount: chunkTexts.length,
  };

  const chunks: MaterialChunk[] = chunkTexts.map((text, idx) => ({
    id: `${idx}`,
    materialId,
    order: idx,
    text,
    materialTitle: material.title,
    subjectId: material.subjectId,
    topicId: material.topicId,
    hasVector: true,
  }));

  // Generate vector embeddings with Gemini for all chunks
  let embeddings: number[][] = [];
  try {
    embeddings = await embedBatch(chunkTexts);
  } catch (err) {
    console.warn("Failed to generate chunk embeddings during material ingestion:", err);
  }

  const BATCH_LIMIT = 200;
  let currentBatch = adminDb.batch();
  let opCount = 0;

  currentBatch.set(matRef, {
    topicId: material.topicId,
    subjectId: material.subjectId,
    title: material.title,
    sourceType: material.sourceType,
    sourceUrl: material.sourceUrl || null,
    wordCount: material.wordCount,
    chunkCount: material.chunkCount,
    createdAt: material.createdAt,
  });
  opCount++;

  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx];
    const chunkRef = adminDb
      .collection(`users/${uid}/materials/${materialId}/chunks`)
      .doc(`${idx}`);

    const chunkDoc: any = {
      order: chunk.order,
      text: chunk.text,
      materialId,
      materialTitle: material.title,
      subjectId: material.subjectId,
      topicId: material.topicId,
      uid,
    };

    if (embeddings[idx] && embeddings[idx].length === 768) {
      chunkDoc.embedding = FieldValue.vector(embeddings[idx]);
    }

    currentBatch.set(chunkRef, chunkDoc);

    // Also index in users/{uid}/chunks for fast vector search
    const unifiedChunkRef = adminDb.collection(`users/${uid}/chunks`).doc(`${materialId}_${idx}`);
    currentBatch.set(unifiedChunkRef, chunkDoc);
    opCount += 2;

    if (opCount >= BATCH_LIMIT) {
      await currentBatch.commit();
      currentBatch = adminDb.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await currentBatch.commit();
  }
  return { material, chunks };
}

export async function deleteMaterial(uid: string, id: string): Promise<void> {
  // Delete chunks subcollection first
  const chunksSnapshot = await adminDb
    .collection(`users/${uid}/materials/${id}/chunks`)
    .get();
  const batch = adminDb.batch();
  chunksSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    batch.delete(adminDb.doc(`users/${uid}/chunks/${id}_${doc.id}`));
  });
  batch.delete(adminDb.doc(`users/${uid}/materials/${id}`));
  await batch.commit();
}

// ----------------- VECTOR ARCHIVE SEARCH -----------------
export interface MatchedChunkResult {
  materialId: string;
  materialTitle: string;
  chunkOrder: number;
  text: string;
  similarityScore: number;
}

export async function findNearestChunksInArchive(
  uid: string,
  queryVector: number[],
  limit: number = 5
): Promise<MatchedChunkResult[]> {
  const collectionRef = adminDb.collection(`users/${uid}/chunks`);
  const vectorVal = FieldValue.vector(queryVector);

  try {
    // 1. Attempt Firestore native vector search with findNearest
    const vectorQuery = collectionRef.findNearest("embedding", vectorVal, {
      limit,
      distanceMeasure: "COSINE",
    });

    const snapshot = await vectorQuery.get();
    if (!snapshot.empty) {
      return snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          materialId: d.materialId,
          materialTitle: d.materialTitle || "Study Material",
          chunkOrder: d.order ?? 0,
          text: d.text || "",
          similarityScore: 0.95,
        };
      });
    }
  } catch (err: any) {
    console.warn("Firestore native findNearest fallback notice:", err?.message);
  }

  // 2. Seamless Fallback: in-memory cosine distance across the user's chunk vectors
  const allDocsSnapshot = await collectionRef.get();
  if (allDocsSnapshot.empty) {
    // If unified collection is empty, check material subcollections
    const materials = await adminDb.collection(`users/${uid}/materials`).get();
    for (const mat of materials.docs) {
      const subChunks = await adminDb.collection(`users/${uid}/materials/${mat.id}/chunks`).get();
      subChunks.docs.forEach((sc) => {
        const data = sc.data();
        allDocsSnapshot.docs.push({
          ...sc,
          data: () => ({
            ...data,
            materialId: mat.id,
            materialTitle: mat.data().title,
          }),
        } as any);
      });
    }
  }

  const scored: Array<{ doc: any; score: number }> = [];

  for (const doc of allDocsSnapshot.docs) {
    const data = doc.data();
    let embValues: number[] | null = null;

    if (data.embedding && typeof data.embedding.toArray === "function") {
      embValues = data.embedding.toArray();
    } else if (data.embedding && Array.isArray(data.embedding._values)) {
      embValues = data.embedding._values;
    } else if (Array.isArray(data.embedding)) {
      embValues = data.embedding;
    }

    if (embValues && embValues.length > 0) {
      let dot = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < Math.min(queryVector.length, embValues.length); i++) {
        dot += queryVector[i] * embValues[i];
        normA += queryVector[i] * queryVector[i];
        normB += embValues[i] * embValues[i];
      }
      const score = normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
      scored.push({ doc: data, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ doc, score }) => ({
    materialId: doc.materialId,
    materialTitle: doc.materialTitle || "Study Material",
    chunkOrder: doc.order ?? 0,
    text: doc.text || "",
    similarityScore: Number(score.toFixed(4)),
  }));
}

/**
 * Ensures all existing chunks in the user's library have vector embeddings.
 */
export async function syncMaterialChunksEmbeddings(
  uid: string
): Promise<{ totalChunks: number; newlyEmbedded: number }> {
  const materials = await adminDb.collection(`users/${uid}/materials`).get();
  let totalChunks = 0;
  let newlyEmbedded = 0;

  for (const mat of materials.docs) {
    const matData = mat.data();
    const chunksSnapshot = await adminDb
      .collection(`users/${uid}/materials/${mat.id}/chunks`)
      .orderBy("order", "asc")
      .get();

    totalChunks += chunksSnapshot.size;
    const missingDocs: Array<{ doc: FirebaseFirestore.QueryDocumentSnapshot; text: string; order: number }> = [];

    for (const chunkDoc of chunksSnapshot.docs) {
      const cdata = chunkDoc.data();
      if (!cdata.embedding) {
        missingDocs.push({
          doc: chunkDoc,
          text: cdata.text || "",
          order: cdata.order ?? 0,
        });
      }
    }

    if (missingDocs.length > 0) {
      const texts = missingDocs.map((m) => m.text);
      const embeddings = await embedBatch(texts);

      const batch = adminDb.batch();
      missingDocs.forEach((item, idx) => {
        if (embeddings[idx] && embeddings[idx].length === 768) {
          const vec = FieldValue.vector(embeddings[idx]);
          const updateData = {
            order: item.order,
            text: item.text,
            materialId: mat.id,
            materialTitle: matData.title || "Study Material",
            subjectId: matData.subjectId,
            topicId: matData.topicId,
            uid,
            embedding: vec,
          };

          batch.update(item.doc.ref, { embedding: vec });
          const unifiedRef = adminDb.collection(`users/${uid}/chunks`).doc(`${mat.id}_${item.order}`);
          batch.set(unifiedRef, updateData, { merge: true });
          newlyEmbedded++;
        }
      });
      await batch.commit();
    }
  }

  return { totalChunks, newlyEmbedded };
}

// ----------------- CONCEPTS & LINKS -----------------
export async function getConcepts(
  uid: string,
  filter?: { topicId?: string; subjectId?: string; materialId?: string }
): Promise<Concept[]> {
  let query: FirebaseFirestore.Query = adminDb.collection(`users/${uid}/concepts`);
  if (filter?.topicId) query = query.where("topicId", "==", filter.topicId);
  if (filter?.subjectId) query = query.where("subjectId", "==", filter.subjectId);
  if (filter?.materialId) query = query.where("materialId", "==", filter.materialId);

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Concept, "id">),
  }));
}

export async function createConceptsAndLinks(
  uid: string,
  concepts: Omit<Concept, "id">[],
  links: Omit<ConceptLink, "id">[]
): Promise<{ createdConcepts: Concept[]; createdLinks: ConceptLink[] }> {
  const createdConcepts: Concept[] = [];
  const createdLinks: ConceptLink[] = [];
  const nameToId = new Map<string, string>();

  const batch = adminDb.batch();

  concepts.forEach((c) => {
    const ref = adminDb.collection(`users/${uid}/concepts`).doc();
    const fullConcept: Concept = { id: ref.id, ...c };
    createdConcepts.push(fullConcept);
    nameToId.set(c.name.toLowerCase().trim(), ref.id);
    batch.set(ref, c);
  });

  links.forEach((l) => {
    const ref = adminDb.collection(`users/${uid}/conceptLinks`).doc();
    const resolvedFrom = nameToId.get(l.fromConcept.toLowerCase().trim()) || l.fromConcept;
    const resolvedTo = nameToId.get(l.toConcept.toLowerCase().trim()) || l.toConcept;
    const fullLink: ConceptLink = {
      id: ref.id,
      fromConcept: resolvedFrom,
      toConcept: resolvedTo,
      relationText: l.relationText,
      strength: l.strength,
      createdAt: l.createdAt,
    };
    createdLinks.push(fullLink);
    batch.set(ref, fullLink);
  });

  await batch.commit();
  return { createdConcepts, createdLinks };
}

export async function createSingleConcept(
  uid: string,
  concept: Omit<Concept, "id">
): Promise<Concept> {
  const ref = adminDb.collection(`users/${uid}/concepts`).doc();
  const fullConcept: Concept = { id: ref.id, ...concept };
  await ref.set(fullConcept);
  return fullConcept;
}

export async function getConceptLinks(uid: string): Promise<ConceptLink[]> {
  const snapshot = await adminDb.collection(`users/${uid}/conceptLinks`).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ConceptLink, "id">),
  }));
}

export async function deleteConceptLink(uid: string, id: string): Promise<void> {
  await adminDb.doc(`users/${uid}/conceptLinks/${id}`).delete();
}

// ----------------- DAILY LOG / READING TIME -----------------
export async function trackReadingTime(
  uid: string,
  materialId: string,
  seconds: number
): Promise<void> {
  if (seconds <= 0) return;
  const dateKey = new Date().toISOString().split("T")[0];
  const ref = adminDb.doc(`users/${uid}/dailyLogs/${dateKey}`);

  await adminDb.runTransaction(async (t) => {
    const doc = await t.get(ref);
    if (!doc.exists) {
      t.set(ref, {
        date: dateKey,
        readingSeconds: seconds,
        reviewsCount: 0,
        materialsRead: [materialId],
        lastUpdated: new Date().toISOString(),
      });
    } else {
      const data = doc.data() || {};
      const materials = new Set<string>(data.materialsRead || []);
      materials.add(materialId);
      t.update(ref, {
        readingSeconds: (data.readingSeconds || 0) + seconds,
        materialsRead: Array.from(materials),
        lastUpdated: new Date().toISOString(),
      });
    }
  });
}

// ----------------- PHASE 4: FSRS & TRIALS -----------------
const fsrsInstance = fsrs();

export async function getWeakestConcepts(
  uid: string,
  limit = 25
): Promise<Concept[]> {
  const concepts = await getConcepts(uid);
  const nowTime = Date.now();

  concepts.sort((a, b) => {
    const dueA = new Date(a.fsrs.due).getTime() <= nowTime ? 1 : 0;
    const dueB = new Date(b.fsrs.due).getTime() <= nowTime ? 1 : 0;
    if (dueA !== dueB) return dueB - dueA; // Due stars first
    if (a.fsrs.stability !== b.fsrs.stability) return a.fsrs.stability - b.fsrs.stability;
    return b.fsrs.difficulty - a.fsrs.difficulty;
  });

  return concepts.slice(0, limit);
}

export async function updateConceptFSRSRatings(
  uid: string,
  updates: Array<{ conceptId: string; rating: Rating }>
): Promise<{ strengthened: ConceptFSRSChange[]; weakened: ConceptFSRSChange[] }> {
  if (updates.length === 0) return { strengthened: [], weakened: [] };

  const now = new Date();
  const strengthened: ConceptFSRSChange[] = [];
  const weakened: ConceptFSRSChange[] = [];

  const batch = adminDb.batch();

  for (const { conceptId, rating } of updates) {
    const docRef = adminDb.doc(`users/${uid}/concepts/${conceptId}`);
    const docSnap = await docRef.get();
    if (!docSnap.exists) continue;

    const concept = docSnap.data() as Concept;
    const currentFsrs = concept.fsrs;

    const card: Card = {
      due: new Date(currentFsrs.due),
      stability: currentFsrs.stability,
      difficulty: currentFsrs.difficulty,
      elapsed_days: currentFsrs.elapsedDays,
      scheduled_days: currentFsrs.scheduledDays,
      learning_steps: 0,
      reps: currentFsrs.reps,
      lapses: currentFsrs.lapses,
      state: currentFsrs.state as State,
      last_review: currentFsrs.lastReview ? new Date(currentFsrs.lastReview) : undefined,
    };

    const record = fsrsInstance.repeat(card, now);
    const validGrade = Math.max(1, Math.min(4, Number(rating))) as 1 | 2 | 3 | 4;
    const nextCard = record[validGrade].card;

    const updatedFsrs: FSRSCardData = {
      due: nextCard.due.toISOString(),
      stability: Number(nextCard.stability.toFixed(2)),
      difficulty: Number(nextCard.difficulty.toFixed(2)),
      elapsedDays: nextCard.elapsed_days,
      scheduledDays: nextCard.scheduled_days,
      reps: nextCard.reps,
      lapses: nextCard.lapses,
      state: nextCard.state,
      lastReview: now.toISOString(),
    };

    batch.update(docRef, { fsrs: updatedFsrs });

    const improved = rating >= Rating.Good;
    const change: ConceptFSRSChange = {
      conceptId,
      conceptName: concept.name,
      oldStability: currentFsrs.stability,
      newStability: updatedFsrs.stability,
      oldDue: currentFsrs.due,
      newDue: updatedFsrs.due,
      rating,
      improved,
    };

    if (improved) {
      strengthened.push(change);
    } else {
      weakened.push(change);
    }
  }

  // Increment review counter in dailyLog
  const dateKey = now.toISOString().split("T")[0];
  const logRef = adminDb.doc(`users/${uid}/dailyLogs/${dateKey}`);
  batch.set(
    logRef,
    {
      date: dateKey,
      reviewsCount: FieldValue.increment(updates.length),
      lastUpdated: now.toISOString(),
    },
    { merge: true }
  );

  await batch.commit();
  return { strengthened, weakened };
}

// ----------------- MUSEUM OF MISTAKES -----------------
export async function getMistakes(
  uid: string,
  resolved?: boolean
): Promise<MistakeExhibit[]> {
  let query: FirebaseFirestore.Query = adminDb
    .collection(`users/${uid}/mistakes`)
    .orderBy("lastTestedAt", "desc");

  if (resolved !== undefined) {
    query = query.where("resolved", "==", resolved);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<MistakeExhibit, "id">),
  }));
}

export async function createMistakeExhibit(
  uid: string,
  data: Omit<MistakeExhibit, "id">
): Promise<MistakeExhibit> {
  const ref = adminDb.collection(`users/${uid}/mistakes`).doc();
  const exhibit: MistakeExhibit = {
    id: ref.id,
    ...data,
  };
  await ref.set(exhibit);
  return exhibit;
}

export async function updateMistakeStreak(
  uid: string,
  mistakeId: string,
  correct: boolean
): Promise<MistakeExhibit | null> {
  const ref = adminDb.doc(`users/${uid}/mistakes/${mistakeId}`);
  let updatedExhibit: MistakeExhibit | null = null;

  await adminDb.runTransaction(async (t) => {
    const doc = await t.get(ref);
    if (!doc.exists) return;
    const current = doc.data() as MistakeExhibit;
    let streak = current.correctStreak || 0;
    let resolved = current.resolved || false;

    if (correct) {
      streak += 1;
      if (streak >= 2) {
        resolved = true;
      }
    } else {
      streak = 0;
      resolved = false;
    }

    const updates = {
      correctStreak: streak,
      resolved,
      lastTestedAt: new Date().toISOString(),
    };

    t.update(ref, updates);
    updatedExhibit = { ...current, ...updates, id: doc.id };
  });

  return updatedExhibit;
}

// ----------------- PHASE 5: OBSERVATORY & SKY -----------------

export async function getDailyLogs(
  uid: string,
  limitDays = 30
): Promise<Record<string, { date: string; reviewsCount?: number; readingSeconds?: number; aiThread?: any }>> {
  const snapshot = await adminDb
    .collection(`users/${uid}/dailyLogs`)
    .orderBy("date", "desc")
    .limit(limitDays)
    .get();

  const logs: Record<string, any> = {};
  snapshot.docs.forEach((doc) => {
    logs[doc.id] = doc.data();
  });
  return logs;
}

export async function getOrGenerateDailyAiThread(
  uid: string,
  concepts: Concept[],
  subjects: Subject[]
): Promise<AiCrossSubjectThread | null> {
  if (concepts.length < 2) return null;

  const dateKey = new Date().toISOString().split("T")[0];
  const logRef = adminDb.doc(`users/${uid}/dailyLogs/${dateKey}`);
  const logSnap = await logRef.get();

  if (logSnap.exists && logSnap.data()?.aiThread) {
    return logSnap.data()?.aiThread as AiCrossSubjectThread;
  }

  // Generate via Gemini
  const thread = await generateCrossSubjectThread({ concepts, subjects });
  if (thread) {
    await logRef.set(
      {
        date: dateKey,
        aiThread: thread,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
  }
  return thread;
}

const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export async function getObservatoryOverview(uid: string): Promise<ObservatoryOverviewData> {
  const [concepts, topics, subjects, dailyLogsMap] = await Promise.all([
    getConcepts(uid),
    getTopics(uid),
    getSubjects(uid),
    getDailyLogs(uid, 35),
  ]);

  const now = new Date();
  const hour = now.getHours();

  // Greetings
  let greetingEn = "Good evening, Astronomer";
  if (hour >= 5 && hour < 12) {
    greetingEn = "Good morning, Astronomer";
  } else if (hour >= 12 && hour < 17) {
    greetingEn = "Good afternoon, Astronomer";
  } else if (hour >= 21 || hour < 5) {
    greetingEn = "The midnight sky is still, Astronomer";
  }

  // Dates
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();
  const monthIdx = now.getMonth();
  const year = now.getFullYear();

  const dateEn = `${EN_DAYS[dayOfWeek]}, ${dayOfMonth} ${EN_MONTHS[monthIdx]} ${year}`;

  // Average sky brightness and fading stars
  let totalRetrievability = 0;
  const fadingStars: Concept[] = [];

  concepts.forEach((c) => {
    const r = calculateConceptRetrievability(c.fsrs, now);
    totalRetrievability += r;
    if (isConceptFading(c, now)) {
      fadingStars.push(c);
    }
  });

  const averageSkyBrightness =
    concepts.length > 0 ? Math.round((totalRetrievability / concepts.length) * 100) : 100;

  // Sort fading stars by lowest retrievability first
  fadingStars.sort((a, b) => {
    const rA = calculateConceptRetrievability(a.fsrs, now);
    const rB = calculateConceptRetrievability(b.fsrs, now);
    return rA - rB;
  });

  // 30-day moon phases and streak
  const { phases, streakDays, currentPhase } = generatePast30DaysMoonPhases(dailyLogsMap, now);

  // Weekly minutes for the last 7 days
  const weeklyMinutes: ObservatoryWeeklyDay[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split("T")[0];
    const log = dailyLogsMap[dateKey];
    const readingMinutes = Math.round((log?.readingSeconds || 0) / 60);
    const reviewCount = log?.reviewsCount || 0;
    // Assume average 1 minute active contemplation per review question
    const totalMinutes = readingMinutes + reviewCount;

    weeklyMinutes.push({
      day: dayNames[d.getDay()],
      date: dateKey,
      readingMinutes,
      reviewCount,
      totalMinutes,
    });
  }

  // Exam countdowns
  const subjectMap = new Map<string, Subject>();
  subjects.forEach((s) => subjectMap.set(s.id, s));

  const examCountdowns: ExamCountdownItem[] = [];
  topics.forEach((t) => {
    if (t.examDate) {
      const examTime = new Date(t.examDate).getTime();
      const diffMs = examTime - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const sub = subjectMap.get(t.subjectId);

      examCountdowns.push({
        topicId: t.id,
        topicName: t.name,
        subjectName: sub?.name || "General",
        subjectColor: sub?.color || "#E6AF2E",
        examDate: t.examDate,
        daysRemaining,
      });
    }
  });

  // Sort exams by closest exam date first
  examCountdowns.sort((a, b) => a.daysRemaining - b.daysRemaining);

  // AI cross-subject thread (cached per calendar day in dailyLogs)
  let aiThread: AiCrossSubjectThread | null = null;
  try {
    aiThread = await getOrGenerateDailyAiThread(uid, concepts, subjects);
  } catch (e) {
    console.error("Error generating daily thread:", e);
  }

  return {
    greetingEn,
    greetingMr: "",
    dateEn,
    dateMr: "",
    totalStars: concepts.length,
    averageSkyBrightness,
    weeklyMinutes,
    fadingStars: fadingStars.slice(0, 15),
    moonPhases: phases,
    streakDays,
    currentMoonPhase: currentPhase,
    examCountdowns,
    aiThread,
  };
}

// ----------------- PHASE 6: DEEP LEARNING MODES REPOSITORY -----------------

export async function saveBlankPageSession(
  uid: string,
  sessionData: Omit<BlankPageSession, "id">
): Promise<{ session: BlankPageSession; fsrsChanges: ConceptFSRSChange[] }> {
  const ref = adminDb.collection(`users/${uid}/blankPageSessions`).doc();

  // Build FSRS updates
  const updates: Array<{ conceptId: string; rating: Rating }> = [];

  // Remembered -> Good (Rating.Good = 3)
  sessionData.evaluation.remembered.forEach((item) => {
    updates.push({ conceptId: item.conceptId, rating: Rating.Good });
  });

  // Partially Remembered -> Hard (Rating.Hard = 2)
  sessionData.evaluation.partiallyRemembered.forEach((item) => {
    updates.push({ conceptId: item.conceptId, rating: Rating.Hard });
  });

  // Missed -> Again (Rating.Again = 1)
  sessionData.evaluation.missed.forEach((item) => {
    updates.push({ conceptId: item.conceptId, rating: Rating.Again });
  });

  const { strengthened, weakened } = await updateConceptFSRSRatings(uid, updates);
  const allFsrsChanges = [...strengthened, ...weakened];

  const fullSession: BlankPageSession = {
    id: ref.id,
    ...sessionData,
    evaluation: {
      ...sessionData.evaluation,
      fsrsChanges: allFsrsChanges,
    },
  };

  await ref.set(fullSession);
  return { session: fullSession, fsrsChanges: allFsrsChanges };
}

export async function saveApprenticeLesson(
  uid: string,
  lessonData: Omit<ApprenticeLesson, "id">
): Promise<{ lesson: ApprenticeLesson; fsrsChange?: ConceptFSRSChange }> {
  const ref = adminDb.collection(`users/${uid}/apprenticeLessons`).doc();

  let fsrsChange: ConceptFSRSChange | undefined;
  if (lessonData.gapReport) {
    const score = lessonData.gapReport.feynmanScore;
    const rating: Rating =
      score >= 80
        ? Rating.Easy
        : score >= 60
        ? Rating.Good
        : score >= 40
        ? Rating.Hard
        : Rating.Again;

    const { strengthened, weakened } = await updateConceptFSRSRatings(uid, [
      { conceptId: lessonData.conceptId, rating },
    ]);
    fsrsChange = strengthened[0] || weakened[0];
  }

  const fullLesson: ApprenticeLesson = {
    id: ref.id,
    ...lessonData,
    gapReport: lessonData.gapReport
      ? {
          ...lessonData.gapReport,
          fsrsChange,
        }
      : undefined,
  };

  await ref.set(fullLesson);
  return { lesson: fullLesson, fsrsChange };
}
