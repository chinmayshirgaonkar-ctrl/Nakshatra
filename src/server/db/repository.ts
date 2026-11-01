import { adminDb } from "@/lib/firebase/admin";
import {
  Subject,
  Topic,
  Material,
  MaterialChunk,
  Concept,
  ConceptLink,
} from "@/lib/types/models";

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
  }));

  const batch = adminDb.batch();
  batch.set(matRef, {
    topicId: material.topicId,
    subjectId: material.subjectId,
    title: material.title,
    sourceType: material.sourceType,
    sourceUrl: material.sourceUrl || null,
    wordCount: material.wordCount,
    chunkCount: material.chunkCount,
    createdAt: material.createdAt,
  });

  chunks.forEach((chunk, idx) => {
    const chunkRef = adminDb
      .collection(`users/${uid}/materials/${materialId}/chunks`)
      .doc(`${idx}`);
    batch.set(chunkRef, {
      order: chunk.order,
      text: chunk.text,
    });
  });

  await batch.commit();
  return { material, chunks };
}

export async function deleteMaterial(uid: string, id: string): Promise<void> {
  // Delete chunks subcollection first
  const chunksSnapshot = await adminDb
    .collection(`users/${uid}/materials/${id}/chunks`)
    .get();
  const batch = adminDb.batch();
  chunksSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(adminDb.doc(`users/${uid}/materials/${id}`));
  await batch.commit();
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
