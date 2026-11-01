/**
 * Partitions text into ordered chunks of approximately `targetWordCount` words,
 * respecting paragraph breaks and sentence boundaries.
 */
export function chunkText(
  text: string,
  targetWordCount = 2000
): { chunks: string[]; wordCount: number } {
  const normalized = text.trim();
  if (!normalized) {
    return { chunks: [], wordCount: 0 };
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  if (totalWords <= targetWordCount) {
    return { chunks: [normalized], wordCount: totalWords };
  }

  // Split by double line breaks (paragraphs)
  const paragraphs = normalized.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWords = 0;

  for (const para of paragraphs) {
    const paraWords = para.split(/\s+/).filter(Boolean).length;

    if (currentWords + paraWords > targetWordCount && currentChunk.length > 0) {
      chunks.push(currentChunk.join("\n\n").trim());
      currentChunk = [para];
      currentWords = paraWords;
    } else {
      currentChunk.push(para);
      currentWords += paraWords;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n\n").trim());
  }

  return { chunks, wordCount: totalWords };
}
