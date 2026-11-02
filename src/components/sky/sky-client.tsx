"use client";

import * as React from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { SkyPayload, Concept, Subject, Topic, ConceptLink } from "@/lib/types/models";
import { computeSkyConstellations } from "./layout-engine";
import { StarNode } from "./sky-types";
import { StarTooltip } from "./star-tooltip";
import { StarDrawer } from "./star-drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Search,
  Flame,
  Maximize2,
  RefreshCw,
  Filter,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const SkyCanvas = dynamic(
  () => import("./sky-canvas").then((mod) => mod.SkyCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-night">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <span className="font-mono text-xs uppercase tracking-widest text-gold-soft">
            Aligning Celestial Coordinate Astrolabe...
          </span>
        </div>
      </div>
    ),
  }
);

const CACHE_KEY = "nakshatra_sky_cache_v1";

interface SkyClientProps {
  initialData?: SkyPayload | null;
}

export function SkyClient({ initialData }: SkyClientProps) {
  const [data, setData] = useState<SkyPayload | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [onlyFading, setOnlyFading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStar, setSelectedStar] = useState<StarNode | null>(null);
  const [hoveredStar, setHoveredStar] = useState<StarNode | null>(null);
  const [hoverScreenPos, setHoverScreenPos] = useState<{ x: number; y: number } | null>(null);

  const cameraRef = useRef<{
    focusOnStar: (starId: string) => void;
    resetView: () => void;
  } | null>(null);

  // Load from client cache or fetch from API
  useEffect(() => {
    if (initialData) {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(initialData));
      } catch (e) {
        // Ignore session storage errors
      }
      return;
    }

    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as SkyPayload;
        setData(parsed);
        setLoading(false);
        return;
      }
    } catch (e) {
      // Ignore cache parse errors
    }

    fetchSkyData();
  }, [initialData]);

  const fetchSkyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sky");
      if (!res.ok) {
        throw new Error(`Failed to load celestial sky (${res.status})`);
      }
      const json = await res.json();
      setData(json);
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(json));
      } catch (e) {
        // Storage quota
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load the sky.");
    } finally {
      setLoading(false);
    }
  };

  // Compute Layout when data changes
  const { stars, topicCentroids, renderLinks } = useMemo(() => {
    if (!data) return { stars: [], topicCentroids: [], renderLinks: [] };
    return computeSkyConstellations({
      concepts: data.concepts || [],
      topics: data.topics || [],
      subjects: data.subjects || [],
      links: data.links || [],
    });
  }, [data]);

  // Fading stars count
  const fadingStarsCount = useMemo(() => {
    return stars.filter((s) => s.isFading).length;
  }, [stars]);

  // Filtered search list
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return stars
      .filter(
        (s) =>
          s.concept.name.toLowerCase().includes(q) ||
          (s.concept.marathiName && s.concept.marathiName.toLowerCase().includes(q)) ||
          s.topic.name.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [stars, searchQuery]);

  // Handler: Update Star FSRS via quick review
  const handleUpdateStarFSRS = async (conceptId: string, rating: number) => {
    const res = await fetch("/api/trials/submit-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: {
          id: `quick-review-${conceptId}`,
          type: "mcq",
          prompt: `Quick review for ${selectedStar?.concept.name}`,
          conceptIds: [conceptId],
          conceptNames: [selectedStar?.concept.name || ""],
          difficulty: "honest",
          explanation: selectedStar?.concept.definition || "",
        },
        userAnswer: rating >= 3 ? "Correct" : "Incorrect",
        isCorrect: rating >= 3,
        confidence: rating === 4 ? "sure" : rating === 3 ? "think_so" : "guessing",
        rubricScore: rating >= 3 ? 3 : 1,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to record review.");
    }

    // Refresh sky data in background
    await fetchSkyData();
  };

  return (
    <div className="relative h-[calc(100vh-6rem)] w-full overflow-hidden rounded-[28px] border border-gold/20 bg-night shadow-2xl">
      {/* Top HUD Controls Bar */}
      <div className="absolute top-4 inset-x-4 z-40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pointer-events-none">
        {/* Left: Celestial Sky Telemetry */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 rounded-2xl border border-gold/20 bg-deep/80 px-4 py-2 backdrop-blur-xl shadow-lg">
            <Sparkles className="w-4 h-4 text-gold animate-twinkle" />
            <span className="font-fraunces text-sm text-ivory">The Sky</span>
            <span className="text-xs font-tiro text-mist">आकाश</span>
            <span className="h-1 w-1 rounded-full bg-gold/50" />
            <span className="text-xs font-mono text-gold-soft">
              {stars.length} Star{stars.length === 1 ? "" : "s"}
            </span>
          </div>

          {fadingStarsCount > 0 && (
            <button
              onClick={() => setOnlyFading(!onlyFading)}
              className={`flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-xs font-mono transition-all backdrop-blur-xl shadow-lg ${
                onlyFading
                  ? "border-ember bg-ember/20 text-ember font-bold shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                  : "border-ember/30 bg-deep/80 text-ember hover:bg-ember/10"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{fadingStarsCount} Fading</span>
            </button>
          )}
        </div>

        {/* Center: Star Search Input */}
        <div className="relative max-w-xs w-full pointer-events-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mist" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search star or concept..."
              className="pl-9 pr-8 h-9 text-xs rounded-xl bg-deep/80 border-gold/20 focus:border-gold backdrop-blur-xl text-ivory placeholder:text-mist/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mist hover:text-ivory text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl border border-gold/25 bg-deep/95 p-1.5 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in max-h-60 overflow-y-auto">
              {searchResults.map((star) => (
                <button
                  key={star.id}
                  onClick={() => {
                    cameraRef.current?.focusOnStar(star.id);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-veil/60 transition-colors group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: star.color }}
                    />
                    <span className="text-xs font-fraunces text-ivory truncate group-hover:text-gold transition-colors">
                      {star.concept.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-mist shrink-0 ml-2">
                    {star.topic.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Subject Partition Filter & Navigation */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {data?.subjects && data.subjects.length > 0 && (
            <div className="flex items-center gap-1 rounded-2xl border border-gold/20 bg-deep/80 p-1 backdrop-blur-xl shadow-lg">
              <button
                onClick={() => setSelectedSubjectId(null)}
                className={`px-3 py-1 text-xs font-mono rounded-xl transition-colors ${
                  selectedSubjectId === null
                    ? "bg-gold text-night font-semibold shadow-sm"
                    : "text-mist hover:text-ivory"
                }`}
              >
                All
              </button>
              {data.subjects.slice(0, 3).map((sub) => (
                <button
                  key={sub.id}
                  onClick={() =>
                    setSelectedSubjectId(selectedSubjectId === sub.id ? null : sub.id)
                  }
                  className={`px-3 py-1 text-xs font-mono rounded-xl transition-colors flex items-center gap-1.5 ${
                    selectedSubjectId === sub.id
                      ? "bg-gold text-night font-semibold shadow-sm"
                      : "text-mist hover:text-ivory"
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: sub.color }}
                  />
                  <span>{sub.name}</span>
                </button>
              ))}
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => cameraRef.current?.resetView()}
            className="h-9 rounded-2xl border-gold/20 bg-deep/80 hover:bg-veil px-3 gap-1.5 text-xs text-mist hover:text-ivory backdrop-blur-xl"
            title="Reset Perspective"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fit</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchSkyData}
            disabled={loading}
            className="h-9 rounded-2xl border-gold/20 bg-deep/80 hover:bg-veil px-3 text-xs text-mist hover:text-ivory backdrop-blur-xl"
            title="Refresh Sky Cache"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      {stars.length > 0 ? (
        <SkyCanvas
          stars={stars}
          topicCentroids={topicCentroids}
          links={renderLinks}
          selectedSubjectId={selectedSubjectId}
          onlyFading={onlyFading}
          selectedStarId={selectedStar?.id || null}
          onSelectStar={(star) => setSelectedStar(star)}
          onHoverStar={(star, screenPos) => {
            setHoveredStar(star);
            setHoverScreenPos(screenPos);
          }}
          cameraRef={cameraRef}
        />
      ) : (
        /* Empty Sky Firmament */
        <div className="relative flex h-full flex-col items-center justify-center p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-gold/30 bg-veil shadow-astral mb-6">
            <Sparkles className="h-9 w-9 text-gold animate-twinkle" />
          </div>
          <h3 className="font-fraunces text-2xl text-ivory mb-2 font-normal">
            Your sky is still dark.
          </h3>
          <p className="max-w-md font-manrope text-xs md:text-sm text-mist leading-relaxed mb-6">
            Ingest your first manuscript or research note into the Library. Each extracted concept will light a coordinate in the living firmament.
          </p>
          <Link href="/library">
            <Button variant="celestial" className="gap-2">
              <Plus className="w-4 h-4 text-night" />
              <span>Ignite First Star in Library</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Floating Star Tooltip HUD */}
      {hoveredStar && hoverScreenPos && !selectedStar && (
        <StarTooltip star={hoveredStar} screenPos={hoverScreenPos} />
      )}

      {/* Slide-Over Star Details Drawer */}
      {selectedStar && (
        <StarDrawer
          star={selectedStar}
          links={renderLinks}
          onClose={() => setSelectedStar(null)}
          onFocusStar={(starId) => cameraRef.current?.focusOnStar(starId)}
          onUpdateStarFSRS={handleUpdateStarFSRS}
        />
      )}
    </div>
  );
}
