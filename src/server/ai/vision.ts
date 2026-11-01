import { getGenAI, getPrimaryModel, withExponentialBackoff } from "./gemini";

export interface TranscribeImageOptions {
  base64Data: string; // base64 without prefix, or with data:image/... prefix
  mimeType?: string;
  languageHint?: "en" | "mr" | "auto";
}

export async function transcribeDocumentImage({
  base64Data,
  mimeType = "image/jpeg",
  languageHint = "auto",
}: TranscribeImageOptions): Promise<string> {
  const ai = getGenAI();
  const modelName = getPrimaryModel();

  // Strip data:image/...;base64, prefix if present
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

  const prompt = `You are a scholarly transcriber for the Nakshatra learning operating system.
Transcribe all text from this study document or handwritten notes with extreme fidelity.

GUIDELINES:
1. Support both English and Marathi (मराठी) text. Accurately transcribe Devanagari script.
2. If mathematical equations, bullet points, headers, or formulas appear, format them cleanly using standard Markdown.
3. Preserve paragraph structure.
4. Output ONLY the transcribed text. Do not include conversational remarks like "Here is the transcription:".`;

  return await withExponentialBackoff(async () => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
          ],
        },
      ],
    });

    return response.text?.trim() || "";
  });
}
