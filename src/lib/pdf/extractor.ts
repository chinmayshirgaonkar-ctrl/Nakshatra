/**
 * In-browser PDF extractor using pdfjs-dist.
 * Extracts text directly if available. If text is sparse (scanned document),
 * renders pages to compressed JPEG images on an off-screen canvas for Gemini Vision.
 */

export interface PdfExtractionResult {
  text: string;
  isScanned: boolean;
  pageImages?: string[]; // base64 JPEG data URLs if scanned
  pageCount: number;
}

export async function extractPdfInBrowser(file: File): Promise<PdfExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();

  // Dynamic import of pdfjs-dist in browser
  const pdfjsLib = await import("pdfjs-dist");

  // Configure worker
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let totalText = "";
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageStr = textContent.items
      .map((item: any) => item.str)
      .join(" ")
      .trim();
    pageTexts.push(pageStr);
    totalText += pageStr + "\n\n";
  }

  // Check if text is substantial. Scanned pages usually have < 40 characters per page
  const avgCharsPerPage = totalText.trim().length / Math.max(1, numPages);
  const isScanned = avgCharsPerPage < 40;

  if (!isScanned) {
    return {
      text: totalText.trim(),
      isScanned: false,
      pageCount: numPages,
    };
  }

  // If scanned, rasterize up to 8 pages at a time into compressed JPEGs
  const pageImages: string[] = [];
  const maxPagesToRender = Math.min(numPages, 10); // cap for safety

  for (let pageNum = 1; pageNum <= maxPagesToRender; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      // Quality 0.75 keeps each page ~150-300 KB
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
      pageImages.push(dataUrl);
    }
  }

  return {
    text: totalText.trim(),
    isScanned: true,
    pageImages,
    pageCount: numPages,
  };
}
