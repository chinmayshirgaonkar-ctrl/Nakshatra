import { getGenAI, getPrimaryModel, withExponentialBackoff } from "./gemini";
import { embedText } from "./embeddings";
import { findNearestChunksInArchive, MatchedChunkResult } from "@/server/db/repository";
import { ArchiveCitation } from "@/lib/types/models";

export interface ArchiveAnswerResult {
  answer: string;
  citations: ArchiveCitation[];
  noArchiveMatch: boolean;
  retrievedChunksCount: number;
}

/**
 * Answers a question grounded ONLY in the user's personal materials using Firestore vector search.
 */
export async function askArchiveQuestion({
  uid,
  question,
  conversationHistory = [],
}: {
  uid: string;
  question: string;
  conversationHistory?: Array<{ role: "user" | "archive"; content: string }>;
}): Promise<ArchiveAnswerResult> {
  // 1. Embed the user's question with Gemini
  const queryVector = await embedText(question);

  // 2. Retrieve nearest chunks using Firestore vector search
  const nearestChunks = await findNearestChunksInArchive(uid, queryVector, 5);

  if (nearestChunks.length === 0) {
    return {
      answer:
        "No relevant study materials found in your personal archive. Please deposit materials into The Library first.",
      citations: [],
      noArchiveMatch: true,
      retrievedChunksCount: 0,
    };
  }

  // 3. Format context excerpts
  const contextBlock = nearestChunks
    .map(
      (c, idx) =>
        `--- EXCERPT ${idx + 1} [Material: "${c.materialTitle}" | MaterialID: ${c.materialId} | Chunk: ${c.chunkOrder}] ---\n${c.text}`
    )
    .join("\n\n");

  const ai = getGenAI();
  const model = getPrimaryModel();

  const systemInstruction = `You are the Chronicler of the Archive in "Nakshatra", a celestial knowledge sanctuary.
Your sacred duty is to answer questions based STRICTLY AND SOLELY on the learner's personal study materials provided in the excerpts below.

IRONCLAD GROUNDING RULES:
1. GROUNDED ONLY: Answer using ONLY the information explicitly found in the ARCHIVE EXCERPTS. Do NOT use outside knowledge, external world assumptions, or unmentioned facts.
2. HONEST UNKNOWNS: If the answer is not mentioned in the excerpts, you MUST clearly state:
   "This is not covered in your archived study materials."
   Never guess, fabricate, or extrapolate beyond what is written.
3. INLINE CITATIONS: For every factual claim, definition, or explanation, you MUST provide an exact citation mark formatted as:
   [Citation: {Material Title}, Chunk {Chunk #}](reading-room://{MaterialID}?chunk={Chunk #})
   Example: "The dispatch algorithm groups riders by destination cluster [Citation: Cab Pooling PRD, Chunk 1](reading-room://abc1234?chunk=1)."
4. LANGUAGE: Answer in English only.
5. TONE: Scholarly, lucid, precise, and respectful.

ARCHIVE EXCERPTS:
${contextBlock}`;

  const prompt = `Learner's Question: "${question}"\n\nAnswer the question strictly from the excerpts above, citing sources with reading-room links. If not found in the excerpts, state clearly that it is not covered.`;

  const responseText = await withExponentialBackoff(async () => {
    const res = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for high factual precision
      },
    });

    return res.text || "";
  });

  const cleanAnswer = responseText.trim();
  const notCoveredKeywords = [
    "not covered in your archived",
    "not mentioned in your archived",
    "not found in your archived",
  ];
  const noArchiveMatch = notCoveredKeywords.some((k) =>
    cleanAnswer.toLowerCase().includes(k.toLowerCase())
  );

  // Map citations from nearest chunks
  const citations: ArchiveCitation[] = nearestChunks.map((c, idx) => ({
    citationNumber: idx + 1,
    materialId: c.materialId,
    materialTitle: c.materialTitle,
    chunkOrder: c.chunkOrder,
    chunkText: c.text,
    similarityScore: c.similarityScore,
  }));

  return {
    answer: cleanAnswer,
    citations,
    noArchiveMatch,
    retrievedChunksCount: nearestChunks.length,
  };
}
