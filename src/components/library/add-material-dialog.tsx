"use client";

import * as React from "react";
import { useState } from "react";
import { Subject, Topic, MaterialSourceType } from "@/lib/types/models";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Upload,
  Camera,
  Globe,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import { extractPdfInBrowser } from "@/lib/pdf/extractor";
import { compressImageInBrowser } from "@/lib/image/compress";

interface AddMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  topics: Topic[];
  onCreateSubject?: (data: {
    name: string;
    marathiName?: string;
    color: string;
    icon: string;
  }) => Promise<Subject>;
  onCreateTopic: (subjectId: string, name: string) => Promise<Topic>;
  onSaveMaterial: (data: {
    topicId: string;
    subjectId: string;
    title: string;
    sourceType: MaterialSourceType;
    sourceUrl?: string;
    rawText: string;
    language: "en" | "mr";
  }) => Promise<{ material: { id: string; title: string }; fullText: string }>;
}

export function AddMaterialDialog({
  open,
  onOpenChange,
  subjects,
  topics,
  onCreateSubject,
  onCreateTopic,
  onSaveMaterial,
}: AddMaterialDialogProps) {
  // Step 1: Source ingestion | Step 2: Review & Edit
  const [step, setStep] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<MaterialSourceType>("text");

  // Ingestion inputs
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");

  const [urlInput, setUrlInput] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Review & Final Payload
  const [finalTitle, setFinalTitle] = useState("");
  const [finalText, setFinalText] = useState("");
  const [finalSourceType, setFinalSourceType] = useState<MaterialSourceType>("text");
  const [finalSourceUrl, setFinalSourceUrl] = useState<string | undefined>(undefined);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [language, setLanguage] = useState<"en" | "mr">("en");

  // Inline subject creation
  const [showInlineSubject, setShowInlineSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState("#E6AF2E");
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);

  // Inline topic creation
  const [newTopicName, setNewTopicName] = useState("");
  const [showInlineTopic, setShowInlineTopic] = useState(false);

  // Loading & status states
  const [isProcessingSource, setIsProcessingSource] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setStep(1);
      setErrorMsg(null);
    }
  }, [open]);

  // Keep selected subject valid
  React.useEffect(() => {
    if (subjects.length > 0) {
      if (!selectedSubjectId || !subjects.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(subjects[0].id);
      }
    } else {
      setShowInlineSubject(true);
    }
  }, [subjects, selectedSubjectId]);

  // Update selected topic when subject changes
  const availableTopics = topics.filter((t) => t.subjectId === selectedSubjectId);
  React.useEffect(() => {
    if (availableTopics.length > 0 && !availableTopics.some((t) => t.id === selectedTopicId)) {
      setSelectedTopicId(availableTopics[0].id);
    }
  }, [availableTopics, selectedTopicId]);

  // Word count & chunk estimate
  const currentWordCount = finalText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedChunks = Math.max(1, Math.ceil(currentWordCount / 2000));

  // --- Handlers for each source ---

  // 1. Text Paste
  const handleProceedFromText = () => {
    if (!pasteText.trim()) {
      setErrorMsg("Please paste or write your study text.");
      return;
    }
    setFinalTitle(pasteTitle.trim() || "Manuscript Notes");
    setFinalText(pasteText.trim());
    setFinalSourceType("text");
    setFinalSourceUrl(undefined);
    setStep(2);
  };

  // 2. PDF Upload
  const handleProcessPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setPdfFile(file);
    setIsProcessingSource(true);
    setProcessingStatus("Extracting text from PDF via browser astrolabe...");

    try {
      const result = await extractPdfInBrowser(file);

      if (!result.isScanned && result.text) {
        setFinalTitle(file.name.replace(/\.[^/.]+$/, ""));
        setFinalText(result.text);
        setFinalSourceType("pdf");
        setFinalSourceUrl(undefined);
        setStep(2);
      } else if (result.isScanned && result.pageImages && result.pageImages.length > 0) {
        // Scanned PDF -> Batch transcribe via Gemini Vision
        setProcessingStatus(
          `Scanned document detected. Transcribing ${result.pageImages.length} page(s) with Gemini Vision...`
        );

        let accumulatedText = "";
        for (let i = 0; i < result.pageImages.length; i++) {
          setProcessingStatus(
            `Transcribing scanned page ${i + 1} of ${result.pageImages.length}...`
          );
          const res = await fetch("/api/ai/transcribe-vision", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: result.pageImages[i] }),
          });
          const data = await res.json();
          if (data.text) {
            accumulatedText += `\n\n### Page ${i + 1}\n\n` + data.text;
          }
        }

        setFinalTitle(file.name.replace(/\.[^/.]+$/, ""));
        setFinalText(accumulatedText.trim());
        setFinalSourceType("pdf");
        setStep(2);
      } else {
        throw new Error("Unable to extract text from this PDF file.");
      }
    } catch (err: any) {
      console.error("PDF processing error:", err);
      setErrorMsg(err?.message || "Failed to parse PDF document.");
    } finally {
      setIsProcessingSource(false);
      setProcessingStatus("");
    }
  };

  // 3. Photo of Notes (Handwritten or Printed)
  const handleProcessPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setPhotoFile(file);
    setIsProcessingSource(true);
    setProcessingStatus("Compressing photo in browser canvas...");

    try {
      const compressedDataUrl = await compressImageInBrowser(file, 1600, 0.8);
      setProcessingStatus("Transcribing Marathi/English handwriting via Gemini Vision...");

      const res = await fetch("/api/ai/transcribe-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressedDataUrl, languageHint: "auto" }),
      });

      const data = await res.json();
      if (!res.ok || !data.text) {
        throw new Error(data.error || "Failed to transcribe document photo.");
      }

      setFinalTitle(file.name.replace(/\.[^/.]+$/, "") || "Visual Note Transcription");
      setFinalText(data.text);
      setFinalSourceType("image");
      setStep(2);
    } catch (err: any) {
      console.error("Photo processing error:", err);
      setErrorMsg(err?.message || "Could not transcribe image notes.");
    } finally {
      setIsProcessingSource(false);
      setProcessingStatus("");
    }
  };

  // 4. URL Fetch
  const handleProcessUrl = async () => {
    if (!urlInput.trim() || !urlInput.startsWith("http")) {
      setErrorMsg("Please enter a valid HTTP/HTTPS URL.");
      return;
    }

    setErrorMsg(null);
    setIsProcessingSource(true);
    setProcessingStatus("Retrieving article and removing clutter...");

    try {
      const res = await fetch("/api/materials/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch webpage content.");
      }

      setFinalTitle(data.title || "Web Scroll");
      setFinalText(data.text);
      setFinalSourceType("url");
      setFinalSourceUrl(urlInput.trim());
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err?.message || "Could not extract article.");
    } finally {
      setIsProcessingSource(false);
      setProcessingStatus("");
    }
  };

  const formatFriendlyError = (err: any, fallback: string): string => {
    const raw = err?.message || String(err || "");
    if (raw.includes("Server Components render") || raw.includes("digest")) {
      return "Server partition error resolved. Please re-enter or confirm your Subject & Topic, then save again.";
    }
    return raw || fallback;
  };

  // Inline subject creator
  const handleCreateSubjectInline = async () => {
    if (!newSubjectName.trim() || !onCreateSubject) return;
    setIsCreatingSubject(true);
    try {
      const created = await onCreateSubject({
        name: newSubjectName.trim(),
        color: newSubjectColor,
        icon: "BookOpen",
      });
      setSelectedSubjectId(created.id);
      setNewSubjectName("");
      setShowInlineSubject(false);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(formatFriendlyError(err, "Failed to create subject."));
    } finally {
      setIsCreatingSubject(false);
    }
  };

  // Inline topic creator
  const handleCreateTopicInline = async () => {
    if (!newTopicName.trim()) return;
    try {
      let subjectId = selectedSubjectId;
      // If no subject is selected or none exist, auto-create one seamlessly
      if (!subjectId) {
        if (onCreateSubject) {
          const fallbackSubjectName = newSubjectName.trim() || "General Studies";
          const createdSub = await onCreateSubject({
            name: fallbackSubjectName,
            color: newSubjectColor || "#E6AF2E",
            icon: "BookOpen",
          });
          subjectId = createdSub.id;
          setSelectedSubjectId(createdSub.id);
          setNewSubjectName("");
          setShowInlineSubject(false);
        } else {
          setErrorMsg("Please select or create a subject partition first.");
          return;
        }
      }

      const created = await onCreateTopic(subjectId, newTopicName.trim());
      setSelectedTopicId(created.id);
      setNewTopicName("");
      setShowInlineTopic(false);
      setErrorMsg(null);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(formatFriendlyError(e, "Failed to create topic."));
    }
  };

  // Final Save & Extract
  const [isSaving, setIsSaving] = useState(false);

  const handleFinalSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);

    try {
      let subjectId = selectedSubjectId;
      let topicId = selectedTopicId;

      // 1. Resolve or create subject
      if (!subjectId) {
        if (subjects.length > 0) {
          subjectId = subjects[0].id;
          setSelectedSubjectId(subjectId);
        } else if (onCreateSubject) {
          const fallbackSubjectName = newSubjectName.trim() || "General Studies";
          const createdSub = await onCreateSubject({
            name: fallbackSubjectName,
            color: newSubjectColor || "#E6AF2E",
            icon: "BookOpen",
          });
          subjectId = createdSub.id;
          setSelectedSubjectId(createdSub.id);
        } else {
          setErrorMsg("Please select or create a subject partition.");
          setIsSaving(false);
          return;
        }
      }

      // 2. Resolve or create topic
      if (!topicId && subjectId) {
        const matchingTopics = topics.filter((t) => t.subjectId === subjectId);
        if (newTopicName.trim()) {
          const createdTopic = await onCreateTopic(subjectId, newTopicName.trim());
          topicId = createdTopic.id;
          setSelectedTopicId(createdTopic.id);
        } else if (matchingTopics.length > 0) {
          topicId = matchingTopics[0].id;
          setSelectedTopicId(topicId);
        } else {
          const createdTopic = await onCreateTopic(subjectId, "Core Concepts");
          topicId = createdTopic.id;
          setSelectedTopicId(createdTopic.id);
        }
      }

      if (!finalTitle.trim() || !finalText.trim() || !topicId || !subjectId) {
        setErrorMsg("Please ensure title, subject, and topic are provided.");
        setIsSaving(false);
        return;
      }

      await onSaveMaterial({
        topicId,
        subjectId,
        title: finalTitle.trim(),
        sourceType: finalSourceType,
        sourceUrl: finalSourceUrl,
        rawText: finalText.trim(),
        language,
      });

      onOpenChange(false);
    } catch (err: any) {
      setErrorMsg(formatFriendlyError(err, "Failed to save manuscript."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
              {step === 1 ? "Deposit Study Scroll" : "Review Manuscript & Partition"}
            </span>
            <span className="h-1 w-1 rounded-full bg-gold/50" />
            <span className="font-tiro text-xs text-mist">
              {step === 1 ? "साहित्य अंतर्ग्रहण" : "पुनरावलोकन व जतन"}
            </span>
          </div>
          <DialogTitle className="font-fraunces text-2xl font-normal text-ivory">
            {step === 1 ? "Choose Knowledge Source" : "Review Extracted Manuscript"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Zero cloud storage — text is parsed in your browser or transcribed via Gemini Vision."
              : "Review, edit, and partition your text. After saving, Nakshatra will chart its concept stars."}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-start justify-between gap-2.5 rounded-xl border border-ember/30 bg-ember/10 p-3.5 text-xs text-ember">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-ember hover:text-ember-light p-0.5 shrink-0 rounded transition-colors"
              title="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* STEP 1: SOURCE SELECTION */}
        {step === 1 && (
          <div className="py-2 space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v as MaterialSourceType);
                setErrorMsg(null);
              }}
            >
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="text" className="gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Text</span>
                </TabsTrigger>
                <TabsTrigger value="pdf" className="gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </TabsTrigger>
                <TabsTrigger value="image" className="gap-2">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Photo</span>
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-2">
                  <Globe className="w-3.5 h-3.5" />
                  <span>URL</span>
                </TabsTrigger>
              </TabsList>

              {/* Source A: Paste Text */}
              <TabsContent value="text" className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-mono uppercase text-mist block mb-1">
                    Scroll Title (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Einstein's 1905 Electrodynamics"
                    value={pasteTitle}
                    onChange={(e) => setPasteTitle(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-mono uppercase text-mist">
                      Manuscript Text
                    </label>
                    <span className="text-[11px] font-mono text-gold-soft">
                      {pasteText.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    className="w-full rounded-2xl border border-gold/20 bg-deep/80 p-4 text-sm text-ivory placeholder:text-mist/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold font-manrope resize-y"
                    placeholder="Paste article, textbook chapter, lecture notes, or personal synthesis..."
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleProceedFromText}
                    variant="celestial"
                    className="gap-2"
                  >
                    <span>Proceed to Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Source B: PDF Upload */}
              <TabsContent value="pdf" className="space-y-4 pt-2">
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gold/30 bg-veil/20 p-8 text-center hover:bg-veil/30 transition-colors">
                  <Upload className="h-10 w-10 text-gold mb-3 animate-twinkle" />
                  <p className="font-fraunces text-base text-ivory mb-1">
                    Select or Drop PDF Manuscript
                  </p>
                  <p className="font-manrope text-xs text-mist max-w-sm mb-4">
                    Text-based PDFs are extracted in milliseconds. Scanned PDFs are seamlessly rendered and transcribed with Gemini Vision.
                  </p>

                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleProcessPdf}
                      disabled={isProcessingSource}
                      className="hidden"
                    />
                    <span className="inline-flex items-center justify-center rounded-full bg-gold px-5 py-2 text-sm font-semibold text-night shadow-astral hover:bg-gold-soft transition-all">
                      Browse Local PDF
                    </span>
                  </label>
                </div>

                {isProcessingSource && (
                  <div className="flex items-center justify-center gap-3 py-4 text-xs font-mono text-gold-soft animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-gold" />
                    <span>{processingStatus}</span>
                  </div>
                )}
              </TabsContent>

              {/* Source C: Photo of Notes */}
              <TabsContent value="image" className="space-y-4 pt-2">
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gold/30 bg-veil/20 p-8 text-center hover:bg-veil/30 transition-colors">
                  <Camera className="h-10 w-10 text-gold mb-3 animate-twinkle" />
                  <p className="font-fraunces text-base text-ivory mb-1">
                    Capture or Upload Handwritten Notes
                  </p>
                  <p className="font-manrope text-xs text-mist max-w-sm mb-4">
                    Takes a photo of whiteboard scribbles, printed handouts, or handwritten notes in English or Marathi. Compressed safely in-browser before OCR.
                  </p>

                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProcessPhoto}
                      disabled={isProcessingSource}
                      className="hidden"
                    />
                    <span className="inline-flex items-center justify-center rounded-full bg-gold px-5 py-2 text-sm font-semibold text-night shadow-astral hover:bg-gold-soft transition-all">
                      Choose Image
                    </span>
                  </label>
                </div>

                {isProcessingSource && (
                  <div className="flex items-center justify-center gap-3 py-4 text-xs font-mono text-gold-soft animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-gold" />
                    <span>{processingStatus}</span>
                  </div>
                )}
              </TabsContent>

              {/* Source D: Web Article URL */}
              <TabsContent value="url" className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-mist block">
                    Article Web Address
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://en.wikipedia.org/wiki/Spaced_repetition"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      disabled={isProcessingSource}
                    />
                    <Button
                      onClick={handleProcessUrl}
                      disabled={isProcessingSource || !urlInput.trim()}
                      variant="celestial"
                      className="shrink-0"
                    >
                      {isProcessingSource ? "Extracting..." : "Fetch Scroll"}
                    </Button>
                  </div>
                  <p className="text-[11px] text-mist font-manrope">
                    Nakshatra fetches the webpage server-side, purges all ads, navbars, and cookie banners, keeping only the scholarly text.
                  </p>
                </div>

                {isProcessingSource && (
                  <div className="flex items-center justify-center gap-3 py-4 text-xs font-mono text-gold-soft animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-gold" />
                    <span>{processingStatus}</span>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* STEP 2: REVIEW & PARTITION */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            {/* Title & Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono uppercase text-mist block mb-1">
                  Manuscript Title
                </label>
                <Input
                  value={finalTitle}
                  onChange={(e) => setFinalTitle(e.target.value)}
                  placeholder="Title of this material"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono uppercase text-mist">
                    Subject Partition
                  </label>
                  {onCreateSubject && (
                    <button
                      type="button"
                      onClick={() => setShowInlineSubject(!showInlineSubject)}
                      className="text-xs font-mono text-gold hover:text-gold-soft flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{subjects.length === 0 ? "Add Subject" : "New Subject"}</span>
                    </button>
                  )}
                </div>

                {showInlineSubject || subjects.length === 0 ? (
                  <div className="space-y-2 rounded-xl border border-gold/30 bg-veil/50 p-3 mb-2 animate-in fade-in">
                    <span className="text-[10px] font-mono text-gold-soft uppercase tracking-wider block">
                      {subjects.length === 0 ? "First Subject Partition Required" : "Create New Subject Partition"}
                    </span>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Subject name (e.g. Product, Physics)"
                        value={newSubjectName}
                        onChange={(e) => {
                          setNewSubjectName(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateSubjectInline();
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="celestial"
                        size="sm"
                        onClick={handleCreateSubjectInline}
                        disabled={!newSubjectName.trim() || isCreatingSubject}
                      >
                        {isCreatingSubject ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
                      </Button>
                    </div>
                    {/* Ribbon color swatch */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono text-mist">Ribbon Color:</span>
                      {["#E6AF2E", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#F97316"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewSubjectColor(c)}
                          className={`w-4 h-4 rounded-full transition-transform ${
                            newSubjectColor === c ? "scale-125 ring-2 ring-gold" : "opacity-70 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-gold/20 bg-deep px-4 py-2 text-sm text-ivory focus:outline-none focus:border-gold"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.marathiName ? `(${s.marathiName})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Topic Selector + Inline Creator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono uppercase text-mist">
                  Topic Constellation
                </label>
                <button
                  type="button"
                  onClick={() => setShowInlineTopic(!showInlineTopic)}
                  className="text-xs font-mono text-gold hover:text-gold-soft flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Topic</span>
                </button>
              </div>

              {showInlineTopic || availableTopics.length === 0 ? (
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Topic name (e.g. Special Relativity, MVP)"
                    value={newTopicName}
                    onChange={(e) => {
                      setNewTopicName(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateTopicInline();
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="celestial"
                    size="sm"
                    onClick={handleCreateTopicInline}
                    disabled={!newTopicName.trim()}
                  >
                    Add
                  </Button>
                </div>
              ) : (
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-gold/20 bg-deep px-4 py-2 text-sm text-ivory focus:outline-none focus:border-gold"
                >
                  {availableTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Editable Text Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono uppercase text-mist">
                  Transcribed Text (Editable)
                </label>
                <div className="flex items-center gap-3 text-xs font-mono text-gold-soft">
                  <span>{currentWordCount} words</span>
                  <span>•</span>
                  <span>{estimatedChunks} chunk{estimatedChunks > 1 ? "s" : ""} (~2,000 w/chunk)</span>
                </div>
              </div>

              <textarea
                rows={9}
                value={finalText}
                onChange={(e) => setFinalText(e.target.value)}
                className="w-full rounded-2xl border border-gold/20 bg-deep/90 p-4 text-xs md:text-sm text-ivory placeholder:text-mist/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold font-manrope resize-y"
              />
            </div>

            {/* Target Language for Concept Extraction */}
            <div className="flex items-center justify-between rounded-xl border border-gold/15 bg-veil/40 p-3">
              <div>
                <span className="font-fraunces text-sm text-ivory block">
                  Concept Language Preference
                </span>
                <span className="text-[11px] text-mist font-manrope">
                  Language for star definitions and mnemonics.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                    language === "en"
                      ? "bg-gold text-night font-semibold shadow-astral"
                      : "text-mist hover:text-ivory"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("mr")}
                  className={`px-3 py-1 rounded-full text-xs font-tiro transition-colors ${
                    language === "mr"
                      ? "bg-gold text-night font-semibold shadow-astral"
                      : "text-mist hover:text-ivory"
                  }`}
                >
                  मराठी
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-gold/15">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={isSaving}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Source</span>
              </Button>

              <Button
                type="button"
                variant="celestial"
                onClick={handleFinalSave}
                disabled={isSaving || !finalText.trim()}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-night" />
                    <span>Transcribing to Chunks...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-night" />
                    <span>Save & Chart Stars</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
