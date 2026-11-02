import { getGenAI, withExponentialBackoff } from "./gemini";

export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSION = 768;

/**
 * Generates a 768-dimensional vector embedding for a single text using Gemini.
 */
export async function embedText(text: string): Promise<number[]> {
  const ai = getGenAI();

  const cleanText = text.trim();
  if (!cleanText) {
    return new Array(EMBEDDING_DIMENSION).fill(0);
  }

  const result = await withExponentialBackoff(async () => {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [cleanText],
      config: {
        outputDimensionality: EMBEDDING_DIMENSION,
      },
    });

    return response.embeddings?.[0]?.values || [];
  });

  if (!result || result.length === 0) {
    throw new Error("Failed to generate embedding from Gemini API.");
  }

  return result;
}

/**
 * Generates vector embeddings for a batch of texts using Gemini.
 * Batches in chunks of up to 10 items to prevent payload timeouts.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const ai = getGenAI();
  const allEmbeddings: number[][] = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const chunk = texts.slice(i, i + BATCH_SIZE).map((t) => t.trim() || " ");

    const batchResult = await withExponentialBackoff(async () => {
      const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: chunk,
        config: {
          outputDimensionality: EMBEDDING_DIMENSION,
        },
      });

      return (response.embeddings || []).map((e) => e.values || []);
    });

    allEmbeddings.push(...batchResult);
  }

  return allEmbeddings;
}
