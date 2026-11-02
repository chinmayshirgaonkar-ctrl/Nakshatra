"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Material, MaterialChunk, Concept, Subject, Topic } from "@/lib/types/models";
import { ReadingProgress } from "./reading-progress";
import { SelectionMenu } from "./selection-menu";
import { RadialMindMap } from "./radial-mindmap";
import {
  FileText,
  Clock,
  Sparkles,
  ListOrdered,
  BookA,
  Smile,
  Compass,
  Scroll,
  RotateCw,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Star,
  Quote,
  Eye,
  Type,
  Languages,
  BookOpen,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReadingRoomClientProps {
  material: Material;
  chunks: MaterialChunk[];
  initialConcepts: Concept[];
  subject?: Subject;
  topic?: Topic;
}

type TabType = "summary" | "key_points" | "glossary" | "eli10" | "mindmap" | "original";
type SummaryLength = "1min" | "5min" | "deep";
type FontSize = "sm" | "md" | "lg";

export function ReadingRoomClient({
  material,
  chunks,
  initialConcepts,
  subject,
  topic,
}: ReadingRoomClientProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>("summary");
  const [summaryLength, setSummaryLength] = React.useState<SummaryLength>("1min");
  const [language, setLanguage] = React.useState<"en" | "mr">("en");
  const [fontSize, setFontSize] = React.useState<FontSize>("md");
  const [focusMode, setFocusMode] = React.useState(false);
  const [concepts, setConcepts] = React.useState<Concept[]>(initialConcepts);

  // Tab Data states
  const [summaries, setSummaries] = React.useState<Record<string, string>>({});
  const [isStreamingSummary, setIsStreamingSummary] = React.useState(false);
  const [keyPointsData, setKeyPointsData] = React.useState<any>(null);
  const [glossaryData, setGlossaryData] = React.useState<any>(null);
  const [eli10Data, setEli10Data] = React.useState<any>(null);
  const [mindMapData, setMindMapData] = React.useState<any>(null);
  const [tabLoading, setTabLoading] = React.useState<Record<string, boolean>>({});

  // Accordion for key points
  const [expandedKeyPoints, setExpandedKeyPoints] = React.useState<Record<number, boolean>>({});

  // Hovered term for Original tab
  const [hoveredConcept, setHoveredConcept] = React.useState<{
    concept: Concept;
    x: number;
    y: number;
  } | null>(null);

  const contentRef = React.useRef<HTMLDivElement>(null);
  const activeSecondsRef = React.useRef(0);

  const searchParams = useSearchParams();
  const requestedChunk = searchParams?.get("chunk");

  // Scroll to cited chunk if opened from Archive citation
  React.useEffect(() => {
    if (requestedChunk !== null && requestedChunk !== undefined) {
      setActiveTab("original");
      const timer = setTimeout(() => {
        const el = document.getElementById(`chunk-${requestedChunk}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [requestedChunk]);

  // Focus mode listener for Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && focusMode) {
        setFocusMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusMode]);

  // Reading time tracking heartbeat
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        activeSecondsRef.current += 15;
        // Flush every 30 seconds
        if (activeSecondsRef.current >= 30) {
          const secs = activeSecondsRef.current;
          activeSecondsRef.current = 0;
          fetch("/api/user/reading-time", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ materialId: material.id, seconds: secs }),
          }).catch(() => {});
        }
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      // Flush remaining on unmount
      if (activeSecondsRef.current > 0) {
        const secs = activeSecondsRef.current;
        activeSecondsRef.current = 0;
        navigator.sendBeacon?.(
          "/api/user/reading-time",
          JSON.stringify({ materialId: material.id, seconds: secs })
        );
      }
    };
  }, [material.id]);

  // Load / Stream Summary
  const loadSummary = React.useCallback(
    async (length: SummaryLength, lang: "en" | "mr", forceRegenerate = false) => {
      const cacheKey = `${length}_${lang}`;
      if (!forceRegenerate && summaries[cacheKey]) {
        return;
      }

      setIsStreamingSummary(true);
      setSummaries((prev) => ({ ...prev, [cacheKey]: "" }));

      try {
        const res = await fetch("/api/ai/reading-room/summary-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materialId: material.id,
            length,
            language: lang,
            regenerate: forceRegenerate,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to generate summary.");
        }

        // If returned direct JSON from Firestore cache
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (data.cached && data.text) {
            setSummaries((prev) => ({ ...prev, [cacheKey]: data.text }));
            setIsStreamingSummary(false);
            return;
          }
        }

        // Stream response body
        const reader = res.body?.getReader();
        if (!reader) throw new Error("Stream reader not available.");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setSummaries((prev) => ({ ...prev, [cacheKey]: accumulated }));
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to stream summary.");
      } finally {
        setIsStreamingSummary(false);
      }
    },
    [material.id, summaries]
  );

  // Load Structured Tab Content
  const loadTabContent = React.useCallback(
    async (tab: TabType, lang: "en" | "mr", forceRegenerate = false) => {
      if (tab === "summary" || tab === "original") return;

      const loadingKey = `${tab}_${lang}`;
      setTabLoading((prev) => ({ ...prev, [loadingKey]: true }));

      try {
        const res = await fetch("/api/ai/reading-room/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materialId: material.id,
            tab,
            language: lang,
            regenerate: forceRegenerate,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load content.");

        if (tab === "key_points") setKeyPointsData(json.data);
        if (tab === "glossary") setGlossaryData(json.data);
        if (tab === "eli10") setEli10Data(json.data);
        if (tab === "mindmap") setMindMapData(json.data);
      } catch (err: any) {
        toast.error(err.message || `Failed to generate ${tab}`);
      } finally {
        setTabLoading((prev) => ({ ...prev, [loadingKey]: false }));
      }
    },
    [material.id]
  );

  // Trigger loading when tab or language changes
  React.useEffect(() => {
    if (activeTab === "summary") {
      loadSummary(summaryLength, language);
    } else if (activeTab === "key_points" && !keyPointsData) {
      loadTabContent("key_points", language);
    } else if (activeTab === "glossary" && !glossaryData) {
      loadTabContent("glossary", language);
    } else if (activeTab === "eli10" && !eli10Data) {
      loadTabContent("eli10", language);
    } else if (activeTab === "mindmap" && !mindMapData) {
      loadTabContent("mindmap", language);
    }
  }, [activeTab, summaryLength, language, loadSummary, loadTabContent, keyPointsData, glossaryData, eli10Data, mindMapData]);

  // Handle Regenerate
  const handleRegenerate = () => {
    if (activeTab === "summary") {
      loadSummary(summaryLength, language, true);
    } else {
      loadTabContent(activeTab, language, true);
    }
  };

  // Font size classes
  const fontClasses =
    fontSize === "sm"
      ? "text-[15px] leading-relaxed"
      : fontSize === "lg"
      ? "text-[21px] leading-[1.8]"
      : "text-[18px] leading-[1.75]";

  const currentSummaryText = summaries[`${summaryLength}_${language}`] || "";
  const isLoadingCurrentTab =
    activeTab === "summary"
      ? isStreamingSummary
      : !!tabLoading[`${activeTab}_${language}`];

  // Original Text with Concept Highlight and Chunk Anchors
  const renderOriginalText = () => {
    const sortedConcepts = [...(concepts || [])].sort((a, b) => b.name.length - a.name.length);
    const escapedTerms = sortedConcepts.map((c) =>
      c.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    const regex = escapedTerms.length > 0 ? new RegExp(`\\b(${escapedTerms.join("|")})\\b`, "gi") : null;

    return (
      <div className="space-y-6">
        {chunks.map((chunk) => {
          const isTarget = requestedChunk !== null && Number(requestedChunk) === chunk.order;
          const parts = regex ? chunk.text.split(regex) : [chunk.text];

          return (
            <div
              key={chunk.id}
              id={`chunk-${chunk.order}`}
              className={cn(
                "p-5 rounded-2xl border transition-all duration-500",
                isTarget
                  ? "border-gold bg-gold/15 shadow-astral ring-2 ring-gold/60"
                  : "border-gold/15 bg-veil/20"
              )}
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-gold/10 text-[10px] font-mono text-gold-soft">
                <span>Passage Chunk {chunk.order + 1}</span>
                {isTarget && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gold text-night font-bold uppercase tracking-wider text-[9px] shadow-astral animate-pulse">
                    Cited In Archive Answer
                  </span>
                )}
              </div>

              <div className="whitespace-pre-line font-serif text-ivory/90 selection:bg-gold/30">
                {parts.map((part, i) => {
                  const matchedConcept = sortedConcepts.find(
                    (c) => c.name.toLowerCase() === part.toLowerCase()
                  );

                  if (matchedConcept) {
                    return (
                      <span
                        key={i}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredConcept({
                            concept: matchedConcept,
                            x: rect.left,
                            y: rect.bottom + 8,
                          });
                        }}
                        onMouseLeave={() => setHoveredConcept(null)}
                        className="relative cursor-pointer font-medium text-gold border-b border-gold/40 hover:bg-gold/15 hover:border-gold px-0.5 rounded transition-colors duration-150"
                      >
                        {part}
                      </span>
                    );
                  }

                  return <React.Fragment key={i}>{part}</React.Fragment>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "relative min-h-screen transition-all duration-300",
        focusMode && "fixed inset-0 z-50 overflow-y-auto bg-void px-2 sm:px-6 py-4"
      )}
    >
      <ReadingProgress />

      {/* Floating Selection Tool (Explain, Make Star, Quiz) */}
      <SelectionMenu
        materialId={material.id}
        language={language}
        containerRef={contentRef}
        onStarCreated={async () => {
          // Re-fetch concepts
          const res = await fetch(`/api/materials/concepts?materialId=${material.id}`).catch(() => null);
          if (res?.ok) {
            const data = await res.json();
            if (data.concepts) setConcepts(data.concepts);
          }
        }}
      />

      {/* Concept Tooltip when hovering over highlighted term in Original tab */}
      {hoveredConcept && (
        <div
          className="fixed z-50 max-w-sm rounded-2xl border border-gold/30 bg-deep/95 p-4 shadow-astral backdrop-blur-md pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          style={{ top: `${hoveredConcept.y}px`, left: `${Math.min(window.innerWidth - 340, Math.max(16, hoveredConcept.x))}px` }}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-gold font-mono text-xs">
              <Star className="w-3.5 h-3.5 fill-gold text-gold" />
              <span>Concept Star</span>
            </div>
            <span className="text-[10px] font-mono text-mist uppercase tracking-wider">
              Pillar {hoveredConcept.concept.importance}/5
            </span>
          </div>
          <h4 className="font-fraunces text-base text-ivory font-normal mb-1">
            {hoveredConcept.concept.name}
            {hoveredConcept.concept.marathiName && (
              <span className="font-tiro text-xs text-mist ml-2">
                ({hoveredConcept.concept.marathiName})
              </span>
            )}
          </h4>
          <p className="font-manrope text-xs text-mist leading-relaxed">
            {hoveredConcept.concept.definition}
          </p>
        </div>
      )}

      {/* Global Control Bar / Lectern */}
      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-300 border-b border-gold/15 bg-void/85 backdrop-blur-md",
          focusMode ? "py-2 px-6" : "py-3 px-4 sm:px-8 mb-6"
        )}
      >
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Breadcrumbs & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/library"
              className="flex items-center gap-1.5 text-xs font-mono text-mist hover:text-gold transition-colors py-1 px-2 rounded-lg border border-gold/10 hover:border-gold/30"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Library</span>
            </Link>

            <div className="h-4 w-px bg-gold/20" />

            <div>
              <div className="flex items-center gap-2">
                {subject && (
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                )}
                <span className="font-mono text-[10px] uppercase tracking-wider text-mist">
                  {subject?.name || "Observatory"} {topic ? `› ${topic.name}` : ""}
                </span>
              </div>
              <h1 className="font-fraunces text-lg text-ivory font-normal line-clamp-1 max-w-md">
                {material.title}
              </h1>
            </div>
          </div>

          {/* Right: Controls (Language, Font, Focus, Regenerate) */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="flex items-center bg-deep/90 border border-gold/20 rounded-xl p-0.5">
              <button
                onClick={() => setLanguage("en")}
                className={cn(
                  "px-2.5 py-1 text-xs font-mono rounded-lg transition-all",
                  language === "en"
                    ? "bg-gold text-night font-bold shadow-sm"
                    : "text-mist hover:text-ivory"
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("mr")}
                className={cn(
                  "px-2.5 py-1 text-xs font-tiro rounded-lg transition-all",
                  language === "mr"
                    ? "bg-gold text-night font-bold shadow-sm"
                    : "text-mist hover:text-ivory"
                )}
              >
                मराठी
              </button>
            </div>

            {/* Font Size Selector */}
            <div className="hidden sm:flex items-center bg-deep/90 border border-gold/20 rounded-xl p-0.5">
              <button
                onClick={() => setFontSize("sm")}
                className={cn(
                  "px-2 py-1 text-xs font-mono rounded-lg transition-all",
                  fontSize === "sm" ? "bg-veil text-gold" : "text-mist hover:text-ivory"
                )}
                title="Small Text"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize("md")}
                className={cn(
                  "px-2 py-1 text-xs font-mono rounded-lg transition-all",
                  fontSize === "md" ? "bg-veil text-gold" : "text-mist hover:text-ivory"
                )}
                title="Medium Text"
              >
                A
              </button>
              <button
                onClick={() => setFontSize("lg")}
                className={cn(
                  "px-2 py-1 text-xs font-mono rounded-lg transition-all",
                  fontSize === "lg" ? "bg-veil text-gold" : "text-mist hover:text-ivory"
                )}
                title="Large Text"
              >
                A+
              </button>
            </div>

            {/* Regenerate Button */}
            <button
              onClick={handleRegenerate}
              disabled={isLoadingCurrentTab}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gold/20 bg-deep/80 text-mist hover:text-gold hover:border-gold/40 text-xs font-mono transition-colors disabled:opacity-50"
              title="Force Regenerate"
            >
              <RotateCw
                className={cn("w-3.5 h-3.5", isLoadingCurrentTab && "animate-spin text-gold")}
              />
              <span className="hidden sm:inline">Regenerate</span>
            </button>

            {/* Focus Mode Toggle */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all",
                focusMode
                  ? "border-gold bg-gold/15 text-gold shadow-sm"
                  : "border-gold/20 bg-deep/80 text-mist hover:text-gold"
              )}
              title="Toggle Focus Mode (Esc to exit)"
            >
              {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{focusMode ? "Exit Focus" : "Focus"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Reading Chamber */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 border-b border-gold/15 scrollbar-none">
          <button
            onClick={() => setActiveTab("summary")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all duration-200 whitespace-nowrap",
              activeTab === "summary"
                ? "bg-gold text-night font-semibold shadow-astral"
                : "text-mist hover:text-ivory hover:bg-gold/10 border border-transparent"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Summaries</span>
          </button>

          <button
            onClick={() => setActiveTab("key_points")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all duration-200 whitespace-nowrap",
              activeTab === "key_points"
                ? "bg-gold text-night font-semibold shadow-astral"
                : "text-mist hover:text-ivory hover:bg-gold/10 border border-transparent"
            )}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Key Points</span>
          </button>

          <button
            onClick={() => setActiveTab("glossary")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all duration-200 whitespace-nowrap",
              activeTab === "glossary"
                ? "bg-gold text-night font-semibold shadow-astral"
                : "text-mist hover:text-ivory hover:bg-gold/10 border border-transparent"
            )}
          >
            <BookA className="w-3.5 h-3.5" />
            <span>Glossary</span>
          </button>

          <button
            onClick={() => setActiveTab("eli10")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all duration-200 whitespace-nowrap",
              activeTab === "eli10"
                ? "bg-gold text-night font-semibold shadow-astral"
                : "text-mist hover:text-ivory hover:bg-gold/10 border border-transparent"
            )}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Explain Like I&apos;m 10</span>
          </button>

          <button
            onClick={() => setActiveTab("mindmap")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all duration-200 whitespace-nowrap",
              activeTab === "mindmap"
                ? "bg-gold text-night font-semibold shadow-astral"
                : "text-mist hover:text-ivory hover:bg-gold/10 border border-transparent"
            )}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Mind Map</span>
          </button>

          <button
            onClick={() => setActiveTab("original")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all duration-200 whitespace-nowrap",
              activeTab === "original"
                ? "bg-gold text-night font-semibold shadow-astral"
                : "text-mist hover:text-ivory hover:bg-gold/10 border border-transparent"
            )}
          >
            <Scroll className="w-3.5 h-3.5" />
            <span>Original ({material.wordCount} words)</span>
          </button>
        </div>

        {/* Tab 1: Summaries */}
        {activeTab === "summary" && (
          <div ref={contentRef} className="space-y-6 animate-in fade-in">
            {/* Sub-tabs for length */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gold/10">
              <div className="flex items-center gap-2 bg-deep/80 border border-gold/15 p-1 rounded-xl">
                <button
                  onClick={() => {
                    setSummaryLength("1min");
                    loadSummary("1min", language);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-mono transition-all",
                    summaryLength === "1min"
                      ? "bg-veil text-gold font-medium border border-gold/30"
                      : "text-mist hover:text-ivory"
                  )}
                >
                  ⚡ 1-Minute
                </button>
                <button
                  onClick={() => {
                    setSummaryLength("5min");
                    loadSummary("5min", language);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-mono transition-all",
                    summaryLength === "5min"
                      ? "bg-veil text-gold font-medium border border-gold/30"
                      : "text-mist hover:text-ivory"
                  )}
                >
                  ⏳ 5-Minute
                </button>
                <button
                  onClick={() => {
                    setSummaryLength("deep");
                    loadSummary("deep", language);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-mono transition-all",
                    summaryLength === "deep"
                      ? "bg-veil text-gold font-medium border border-gold/30"
                      : "text-mist hover:text-ivory"
                  )}
                >
                  🌊 Deep Dive
                </button>
              </div>

              {isStreamingSummary && (
                <div className="flex items-center gap-2 text-xs font-mono text-gold animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Streaming celestial synthesis…</span>
                </div>
              )}
            </div>

            {/* Rendered Summary Article */}
            <article
              className={cn(
                "prose prose-invert max-w-none font-serif text-ivory/90",
                fontClasses,
                language === "mr" && "font-tiro"
              )}
            >
              {currentSummaryText ? (
                <div className="whitespace-pre-line leading-relaxed selection:bg-gold/30">
                  {currentSummaryText}
                  {isStreamingSummary && (
                    <span className="inline-block w-2 h-4 ml-1 bg-gold animate-pulse align-middle" />
                  )}
                </div>
              ) : isStreamingSummary ? (
                <div className="py-16 text-center text-mist space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold" />
                  <p className="font-mono text-xs text-gold-soft">
                    Summoning observatory star thoughts…
                  </p>
                </div>
              ) : (
                <div className="py-16 text-center text-mist">
                  <p className="font-manrope text-sm">
                    No summary generated yet. Click Regenerate to stream the summary.
                  </p>
                </div>
              )}
            </article>
          </div>
        )}

        {/* Tab 2: Key Points */}
        {activeTab === "key_points" && (
          <div ref={contentRef} className="space-y-4 animate-in fade-in">
            {tabLoading[`key_points_${language}`] ? (
              <div className="py-16 text-center text-mist space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold" />
                <p className="font-mono text-xs text-gold-soft">
                  Distilling core principles & citations…
                </p>
              </div>
            ) : keyPointsData?.keyPoints?.length > 0 ? (
              keyPointsData.keyPoints.map((item: any) => {
                const isExpanded = !!expandedKeyPoints[item.number];
                return (
                  <div
                    key={item.number}
                    className="rounded-2xl border border-gold/15 bg-deep/70 p-5 shadow-deep transition-all duration-200 hover:border-gold/30"
                  >
                    <div
                      onClick={() =>
                        setExpandedKeyPoints((prev) => ({
                          ...prev,
                          [item.number]: !isExpanded,
                        }))
                      }
                      className="flex items-start justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-veil text-xs font-mono font-bold text-gold">
                          {item.number}
                        </span>
                        <div>
                          <h3 className="font-fraunces text-base sm:text-lg text-ivory font-normal leading-snug">
                            {item.point}
                          </h3>
                          <p className="font-manrope text-xs sm:text-sm text-mist/90 pt-1.5 leading-relaxed">
                            {item.explanation}
                          </p>
                        </div>
                      </div>

                      <button className="p-1 text-mist hover:text-gold rounded-lg transition-colors">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Expandable original quotation */}
                    {isExpanded && item.supportingQuote && (
                      <div className="mt-4 pt-3 border-t border-gold/10 rounded-xl bg-veil/40 p-3.5 animate-in fade-in">
                        <div className="flex items-center gap-1.5 text-gold-soft font-mono text-[10px] uppercase tracking-wider mb-1.5">
                          <Quote className="w-3.5 h-3.5 text-gold" />
                          <span>Supporting Source Line</span>
                        </div>
                        <blockquote className="font-serif italic text-xs sm:text-sm text-ivory/80 leading-relaxed border-l-2 border-gold/40 pl-3">
                          &ldquo;{item.supportingQuote}&rdquo;
                        </blockquote>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-mist">
                <p>No key points found. Click Regenerate to extract points.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Glossary */}
        {activeTab === "glossary" && (
          <div ref={contentRef} className="space-y-4 animate-in fade-in">
            {tabLoading[`glossary_${language}`] ? (
              <div className="py-16 text-center text-mist space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold" />
                <p className="font-mono text-xs text-gold-soft">
                  Compiling astronomical glossary…
                </p>
              </div>
            ) : glossaryData?.terms?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {glossaryData.terms.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex flex-col justify-between rounded-2xl border border-gold/15 bg-deep/70 p-5 shadow-deep transition-all duration-200 hover:border-gold/30 hover:shadow-astral"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-gold-soft">
                          Term {i + 1}
                        </span>
                        {item.marathiTerm && (
                          <span className="font-tiro text-xs text-mist">
                            {item.marathiTerm}
                          </span>
                        )}
                      </div>
                      <h4 className="font-fraunces text-base text-ivory font-normal mb-2">
                        {item.term}
                      </h4>
                      <p className="font-manrope text-xs sm:text-sm text-mist leading-relaxed">
                        {item.definition}
                      </p>
                    </div>

                    {item.context && (
                      <div className="mt-3 pt-2.5 border-t border-gold/10 text-[11px] font-mono text-mist/70 italic">
                        Context: {item.context}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-mist">
                <p>No glossary terms found. Click Regenerate to build.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Explain Like I'm 10 (ELI10) */}
        {activeTab === "eli10" && (
          <div ref={contentRef} className="space-y-6 animate-in fade-in">
            {tabLoading[`eli10_${language}`] ? (
              <div className="py-16 text-center text-mist space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold" />
                <p className="font-mono text-xs text-gold-soft">
                  Crafting playful analogies for curious minds…
                </p>
              </div>
            ) : eli10Data ? (
              <div className="space-y-6">
                {/* Big Picture summary */}
                <div className="rounded-3xl border border-gold/25 bg-deep/80 p-6 sm:p-8 shadow-astral">
                  <div className="flex items-center gap-2 mb-3">
                    <Smile className="w-5 h-5 text-gold" />
                    <span className="font-mono text-xs uppercase tracking-widest text-gold-soft">
                      The Simple Story
                    </span>
                  </div>
                  <div
                    className={cn(
                      "font-serif text-ivory/90 leading-relaxed whitespace-pre-line",
                      fontClasses
                    )}
                  >
                    {eli10Data.summary}
                  </div>
                </div>

                {/* Analogy Spotlights */}
                <div className="space-y-4">
                  <h3 className="font-fraunces text-xl text-ivory font-normal">
                    Analogy Spotlights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {eli10Data.analogies?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-gold/20 bg-veil/60 p-5 shadow-deep flex flex-col justify-between"
                      >
                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-gold-soft block mb-1">
                            Metaphor #{idx + 1}
                          </span>
                          <h4 className="font-fraunces text-base text-ivory font-normal mb-2">
                            {item.title}
                          </h4>
                          <p className="font-manrope text-xs text-mist leading-relaxed mb-4">
                            {item.analogy}
                          </p>
                        </div>

                        <div className="rounded-xl border border-gold/15 bg-deep/60 p-2.5 text-[11px] font-mono text-gold-soft">
                          💡 {item.takeaway}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-mist">
                <p>No ELI10 content yet. Click Regenerate.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Mind Map */}
        {activeTab === "mindmap" && (
          <div className="animate-in fade-in">
            {tabLoading[`mindmap_${language}`] ? (
              <div className="py-16 text-center text-mist space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold" />
                <p className="font-mono text-xs text-gold-soft">
                  Charting radial constellation orbits…
                </p>
              </div>
            ) : mindMapData?.root ? (
              <RadialMindMap data={mindMapData} materialTitle={material.title} />
            ) : (
              <div className="py-16 text-center text-mist">
                <p>No mind map generated yet. Click Regenerate to chart.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Original */}
        {activeTab === "original" && (
          <div ref={contentRef} className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gold/15">
              <div className="flex items-center gap-2">
                <Scroll className="w-4 h-4 text-gold" />
                <span className="font-mono text-xs uppercase tracking-widest text-gold-soft">
                  Raw Manuscript ({material.chunkCount} chunk{material.chunkCount > 1 ? "s" : ""})
                </span>
              </div>
              <span className="font-mono text-xs text-mist">
                {concepts.length} concept stars hover-highlighted
              </span>
            </div>

            <article
              className={cn("max-w-none leading-relaxed text-ivory/90", fontClasses)}
            >
              {renderOriginalText()}
            </article>
          </div>
        )}
      </main>
    </div>
  );
}
