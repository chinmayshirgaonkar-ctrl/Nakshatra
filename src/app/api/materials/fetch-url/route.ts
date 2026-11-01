import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "A valid URL is required." }, { status: 400 });
    }

    // Server-side fetch with friendly reader User-Agent
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 NakshatraReader/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL. Server returned HTTP ${res.status}.` },
        { status: 502 }
      );
    }

    const html = await res.text();

    // Extract Title
    let title = "";
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
      // Strip common suffixes like " | Medium", " - Wikipedia", etc.
      title = title.replace(/\s*([|\-–—]|::)\s*[^|\-–—:]+$/i, "").trim();
    }

    // Strip boilerplate HTML elements
    let cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, "")
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "");

    // Convert headings and paragraphs into readable markdown
    cleanText = cleanText
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n\n### $1\n\n")
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n\n$1\n\n")
      .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n* $1")
      .replace(/<br\s*[\/]?>/gi, "\n")
      .replace(/<[^>]+>/g, " "); // strip remaining tags

    // Decode HTML entities
    cleanText = cleanText
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ");

    // Normalize spacing
    cleanText = cleanText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n\n")
      .trim();

    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      title: title || "Extracted Manuscript",
      text: cleanText,
      wordCount,
    });
  } catch (err: any) {
    console.error("URL extraction failed:", err);
    return NextResponse.json(
      { error: "Could not extract text from article URL.", details: err?.message },
      { status: 500 }
    );
  }
}
