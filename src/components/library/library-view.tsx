"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Subject, Topic, Material, Concept, ConceptLink } from "@/lib/types/models";
import { SubjectSpines } from "./subject-spines";
import { MaterialCard } from "./material-card";
import { AddMaterialDialog } from "./add-material-dialog";
import { ChartingStarsModal } from "./charting-stars-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  BookOpen,
  ArrowUpDown,
  Calendar,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  createSubjectAction,
  updateSubjectAction,
  deleteSubjectAction,
  reorderSubjectsAction,
  createTopicAction,
  updateTopicAction,
  deleteTopicAction,
  createMaterialAction,
  deleteMaterialAction,
} from "@/app/library/actions";

interface LibraryViewProps {
  initialSubjects: Subject[];
  initialTopics: Topic[];
  initialMaterials: Material[];
  initialConcepts: Concept[];
}

export function LibraryView({
  initialSubjects,
  initialTopics,
  initialMaterials,
  initialConcepts,
}: LibraryViewProps) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [concepts, setConcepts] = useState<Concept[]>(initialConcepts);

  // Filter & Search & Sort states
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "weakest" | "alpha">("recent");

  // Modals
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);

  // Concept Extraction & Charting Modal state
  const [chartingModalOpen, setChartingModalOpen] = useState(false);
  const [chartingTitle, setChartingTitle] = useState("");
  const [chartingMaterialId, setChartingMaterialId] = useState<string | undefined>();
  const [extractedConcepts, setExtractedConcepts] = useState<Concept[]>([]);
  const [extractedLinks, setExtractedLinks] = useState<ConceptLink[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  // Subject Handlers
  const handleCreateSubject = async (data: {
    name: string;
    marathiName?: string;
    color: string;
    icon: string;
  }) => {
    const created = await createSubjectAction(data);
    setSubjects((prev) => [...prev, created]);
    return created;
  };

  const handleUpdateSubject = async (
    id: string,
    data: { name?: string; marathiName?: string; color?: string; icon?: string }
  ) => {
    await updateSubjectAction(id, data);
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data } : s))
    );
  };

  const handleDeleteSubject = async (id: string) => {
    await deleteSubjectAction(id);
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    if (selectedSubjectId === id) setSelectedSubjectId(null);
  };

  const handleReorderSubjects = async (orderedIds: string[]) => {
    const reordered = orderedIds
      .map((id) => subjects.find((s) => s.id === id))
      .filter(Boolean) as Subject[];
    setSubjects(reordered);
    await reorderSubjectsAction(orderedIds);
  };

  // Topic Handlers
  const handleCreateTopic = async (subjectId: string, name: string) => {
    const created = await createTopicAction({ subjectId, name });
    setTopics((prev) => [...prev, created]);
    return created;
  };

  // Material Handlers
  const handleSaveMaterial = async (data: {
    topicId: string;
    subjectId: string;
    title: string;
    sourceType: any;
    sourceUrl?: string;
    rawText: string;
    language: "en" | "mr";
  }) => {
    // 1. Save material & chunks to DB
    const { material, fullText } = await createMaterialAction(data);
    setMaterials((prev) => [material, ...prev]);

    // 2. Launch Charting Stars Modal
    setChartingTitle(material.title);
    setChartingMaterialId(material.id);
    setExtractedConcepts([]);
    setExtractedLinks([]);
    setIsExtracting(true);
    setChartingModalOpen(true);

    try {
      // 3. Trigger Concept Extraction API
      const res = await fetch("/api/ai/extract-concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: material.id,
          topicId: material.topicId,
          subjectId: material.subjectId,
          text: fullText,
          language: data.language,
        }),
      });

      const extracted = await res.json();
      if (res.ok && extracted.concepts) {
        setExtractedConcepts(extracted.concepts);
        setExtractedLinks(extracted.links || []);
        setConcepts((prev) => [...prev, ...extracted.concepts]);
      } else {
        console.error("Concept extraction returned error:", extracted.error);
      }
    } catch (e) {
      console.error("Failed to run concept extraction:", e);
    } finally {
      setIsExtracting(false);
    }

    return { material, fullText };
  };

  const handleDeleteMaterial = async (id: string) => {
    await deleteMaterialAction(id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    setConcepts((prev) => prev.filter((c) => c.materialId !== id));
  };

  // Filtered & Sorted Materials
  const filteredMaterials = useMemo(() => {
    let list = [...materials];

    // Subject Filter
    if (selectedSubjectId) {
      list = list.filter((m) => m.subjectId === selectedSubjectId);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) => m.title.toLowerCase().includes(q));
    }

    // Sorting
    if (sortBy === "recent") {
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === "alpha") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "weakest") {
      // Sort by materials with the most due concepts
      const now = Date.now();
      const getDueScore = (matId: string) => {
        return concepts.filter(
          (c) => c.materialId === matId && new Date(c.fsrs.due).getTime() <= now
        ).length;
      };
      list.sort((a, b) => getDueScore(b.id) - getDueScore(a.id));
    }

    return list;
  }, [materials, selectedSubjectId, searchQuery, sortBy, concepts]);

  // Group filtered materials by topic
  const activeTopics = useMemo(() => {
    let list = topics;
    if (selectedSubjectId) {
      list = list.filter((t) => t.subjectId === selectedSubjectId);
    }
    return list;
  }, [topics, selectedSubjectId]);

  return (
    <div className="space-y-10">
      {/* Chamber Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gold/15">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
              Vault of Tomes
            </span>
            <span className="h-1 w-1 rounded-full bg-gold/50" />
            <span className="font-tiro text-xs text-mist">ग्रंथालय दालन</span>
          </div>
          <h1 className="font-fraunces text-3xl font-light text-ivory">The Library</h1>
        </div>

        <Button
          onClick={() => setAddMaterialOpen(true)}
          variant="celestial"
          className="gap-2 shadow-astral"
        >
          <Plus className="w-4 h-4 text-night" />
          <span>Deposit Material</span>
        </Button>
      </div>

      {/* Subject Spines (Book Spines Row) */}
      <SubjectSpines
        subjects={subjects}
        topics={topics}
        materials={materials}
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={setSelectedSubjectId}
        onCreateSubject={handleCreateSubject}
        onUpdateSubject={handleUpdateSubject}
        onDeleteSubject={handleDeleteSubject}
        onReorderSubjects={handleReorderSubjects}
      />

      {/* Search, Filter & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
          <Input
            placeholder="Search manuscripts by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs font-mono text-mist">
            <ArrowUpDown className="w-3.5 h-3.5 text-gold" />
            <span>Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-10 rounded-xl border border-gold/20 bg-deep px-3 text-xs text-ivory focus:outline-none focus:border-gold"
          >
            <option value="recent">Most Recent (नुकतेच)</option>
            <option value="weakest">Weakest Memory (पुनरावलोकन आवश्यक)</option>
            <option value="alpha">Alphabetical (अकारविल्हे)</option>
          </select>
        </div>
      </div>

      {/* Materials List Grouped By Topic */}
      {filteredMaterials.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-[28px] border border-gold/20 bg-deep/50 p-12 md:p-16 text-center backdrop-blur-sm min-h-[380px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/30 bg-veil shadow-astral mb-5">
            <BookOpen className="h-8 w-8 text-gold animate-twinkle" />
          </div>

          <span className="font-mono text-xs uppercase tracking-widest text-gold-soft mb-2">
            Silence in the Vaults
          </span>
          <h2 className="font-fraunces text-2xl text-ivory mb-2 font-normal">
            No Manuscripts Found
          </h2>
          <p className="font-manrope text-xs text-mist max-w-sm leading-relaxed mb-6">
            {searchQuery
              ? "No scrolls matched your search phrase. Try a different query."
              : "Deposit a PDF, lecture notes, web article, or plain text to begin charting concepts."}
          </p>

          <Button
            onClick={() => setAddMaterialOpen(true)}
            variant="celestial"
            className="gap-2"
          >
            <Plus className="w-4 h-4 text-night" />
            <span>Deposit First Material</span>
          </Button>
        </div>
      ) : (
        /* Display Grouped by Topics */
        <div className="space-y-10">
          {activeTopics.map((topic) => {
            const topicMaterials = filteredMaterials.filter(
              (m) => m.topicId === topic.id
            );
            if (topicMaterials.length === 0 && searchQuery) return null;

            return (
              <div key={topic.id} className="space-y-4">
                {/* Topic Banner */}
                <div className="flex items-center justify-between pb-2 border-b border-gold/10">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-gold shadow-astral" />
                    <div>
                      <h2 className="font-fraunces text-xl text-ivory font-normal">
                        {topic.name}
                      </h2>
                      {topic.marathiName && (
                        <span className="text-[11px] font-tiro text-gold-soft">
                          {topic.marathiName}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-mono text-mist">
                    {topicMaterials.length} scroll{topicMaterials.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Grid of Materials */}
                {topicMaterials.length === 0 ? (
                  <p className="text-xs font-manrope text-mist/60 italic py-2 pl-5">
                    No scrolls deposited in this constellation yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {topicMaterials.map((mat) => (
                      <MaterialCard
                        key={mat.id}
                        material={mat}
                        concepts={concepts}
                        onDelete={handleDeleteMaterial}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Material Dialog */}
      <AddMaterialDialog
        open={addMaterialOpen}
        onOpenChange={setAddMaterialOpen}
        subjects={subjects}
        topics={topics}
        onCreateSubject={handleCreateSubject}
        onCreateTopic={handleCreateTopic}
        onSaveMaterial={handleSaveMaterial}
      />

      {/* Charting New Stars Animation Modal */}
      <ChartingStarsModal
        open={chartingModalOpen}
        materialTitle={chartingTitle}
        materialId={chartingMaterialId}
        concepts={extractedConcepts}
        links={extractedLinks}
        isExtracting={isExtracting}
        onClose={() => setChartingModalOpen(false)}
      />
    </div>
  );
}
