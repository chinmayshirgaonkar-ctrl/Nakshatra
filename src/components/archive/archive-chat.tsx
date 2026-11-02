"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Material, Subject, ArchiveCitation, ArchiveMessage } from "@/lib/types/models";
import { Button } from "@/components/ui/button";
import {
  Search,
  Sparkles,
  Send,
  Loader2,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Database,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Library,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface ArchiveChatProps {
  materials: Material[];
  subjects: Subject[];
}

export function ArchiveChat({ materials, subjects }: ArchiveChatProps) {
  const [messages, setMessages] = useState<ArchiveMessage[]>([
    {
      id: "initial-welcome",
      role: "archive",
      content:
        "Welcome to the Chronicler's Desk. I answer questions grounded strictly and exclusively in your own deposited study scrolls. If an answer cannot be deduced from your personal notes, I will let you know plainly instead of guessing.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAsking]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Quick suggestion prompts based on actual uploaded materials
  const sampleSuggestions = React.useMemo(() => {
    if (materials.length === 0) {
      return [
        "What are the main principles in my notes?",
        "Explain key terms mentioned in my library.",
      ];
    }
    return [
      `Summarize the key requirements from "${materials[0].title}".`,
      `What does "${materials[0].title}" state about edge cases?`,
      `Compare the main themes across my library scrolls.`,
    ];
  }, [materials]);

  // Sync / Backfill embeddings
  const handleSyncVectors = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/archive/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync vectors");

      toast.success(
        `Archive Vector Sync Complete: ${data.totalChunks} chunk(s) indexed in Firestore vector space (${data.newlyEmbedded} newly embedded).`
      );
    } catch (e: any) {
      toast.error(e.message || "Failed to sync archive vectors");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q || isAsking) return;

    setQuestion("");
    const userMsg: ArchiveMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: q,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAsking(true);

    try {
      const res = await fetch("/api/archive/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not query archive.");
      }

      const archiveMsg: ArchiveMessage = {
        id: `archive-${Date.now()}`,
        role: "archive",
        content: data.answer,
        citations: data.citations || [],
        noArchiveMatch: !!data.noArchiveMatch,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, archiveMsg]);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to query the Archive.");
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "archive",
          content:
            "A celestial disturbance occurred while searching the archive vectors. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  // Convert inline citations like [Citation: Title, Chunk X](reading-room://materialId?chunk=X) into clickable pills
  const renderMessageContent = (msg: ArchiveMessage) => {
    const text = msg.content;
    const citationRegex = /\[Citation:\s*([^,\]]+),\s*Chunk\s*(\d+)\]\(reading-room:\/\/([^?)]+)\?chunk=(\d+)\)/gi;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = citationRegex.exec(text)) !== null) {
      const [fullMatch, title, chunkNum, materialId, chunkParam] = match;
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        parts.push(text.slice(lastIndex, matchIndex));
      }

      parts.push(
        <Link
          key={`${matchIndex}-${materialId}`}
          href={`/reading-room?id=${materialId}&chunk=${chunkParam}`}
          target="_blank"
          className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-full border border-gold/30 bg-gold/15 hover:bg-gold/30 text-gold-soft hover:text-gold text-xs font-mono font-medium transition-colors align-middle shadow-sm"
          title={`Open "${title}" at Chunk ${chunkNum} in Reading Room`}
        >
          <BookOpen className="w-3 h-3 text-gold" />
          <span>{title} (Passage {chunkNum})</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
        </Link>
      );

      lastIndex = matchIndex + fullMatch.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed font-manrope text-sm text-ivory">
        {parts.length > 0 ? parts : text}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-gold/20 bg-deep/80 p-6 backdrop-blur-xl shadow-astral">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
              Strictly Grounded Retrieval
            </span>
          </div>
          <h1 className="font-fraunces text-2xl md:text-3xl font-light text-ivory">
            Ask the Archive
          </h1>
          <p className="font-manrope text-xs text-mist max-w-xl">
            Query your library scrolls using Firestore vector search. Answers are derived
            <strong> strictly from your notes</strong> with verifiable inline citations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSyncVectors}
            disabled={isSyncing}
            className="border-gold/25 hover:border-gold text-mist hover:text-ivory text-xs gap-1.5"
            title="Index all library chunks into Firestore vector space"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gold-soft ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Indexing..." : "Sync Vectors"}</span>
          </Button>
        </div>
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && (
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-mist/80 block">
            Suggested Inquiries into your manuscripts:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleSuggestions.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAsk(prompt)}
                disabled={isAsking}
                className="text-xs font-manrope text-ivory/90 bg-deep/80 hover:bg-gold/15 border border-gold/20 hover:border-gold px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-gold-soft" />
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dialogue Message Hall */}
      <div className="rounded-2xl border border-gold/20 bg-deep/60 p-4 md:p-6 min-h-[440px] max-h-[580px] overflow-y-auto space-y-5 backdrop-blur-sm shadow-inner">
        {messages.map((m) => {
          const isArchive = m.role === "archive";

          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isArchive ? "justify-start" : "justify-end"}`}
            >
              {isArchive && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold/30 to-blue-600/30 border border-gold/40 flex items-center justify-center shrink-0 mt-1 shadow-astral">
                  <Library className="w-4 h-4 text-gold" />
                </div>
              )}

              <div
                className={`max-w-[85%] md:max-w-[78%] rounded-2xl p-4 text-sm leading-relaxed space-y-3 ${
                  isArchive
                    ? "bg-night/90 border border-gold/20 text-ivory rounded-tl-sm shadow-md"
                    : "bg-gold/20 border border-gold/40 text-amber-50 rounded-tr-sm shadow-astral"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono border-b border-gold/10 pb-1.5">
                  <span className="uppercase text-gold-soft">
                    {isArchive ? "The Archive Chronicler" : "Learner"}
                  </span>
                  <span className="text-mist">
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Absence Notice if outside personal notes */}
                {m.noArchiveMatch && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-xs font-manrope text-amber-200">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      This concept was not found in your deposited study materials.
                      Nakshatra refuses to hallucinate facts outside of your personal library.
                    </span>
                  </div>
                )}

                {/* Render Answer with Citations */}
                <div>{renderMessageContent(m)}</div>

                {/* Expandable Citations Drawer */}
                {m.citations && m.citations.length > 0 && !m.noArchiveMatch && (
                  <div className="pt-2 border-t border-gold/10 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSources((prev) => ({
                          ...prev,
                          [m.id]: !prev[m.id],
                        }))
                      }
                      className="text-gold-soft hover:text-gold flex items-center gap-1.5 transition-colors"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>
                        Verified from {m.citations.length} Archive Excerpt
                        {m.citations.length > 1 ? "s" : ""}
                      </span>
                      {expandedSources[m.id] ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {expandedSources[m.id] && (
                      <div className="mt-3 space-y-2.5 animate-in fade-in">
                        {m.citations.map((c) => (
                          <div
                            key={c.citationNumber}
                            className="p-3 rounded-xl border border-gold/15 bg-deep/80 text-[11px] font-manrope space-y-1.5"
                          >
                            <div className="flex items-center justify-between font-mono text-gold-soft text-[10px]">
                              <span>
                                Excerpt {c.citationNumber}: {c.materialTitle} (Passage {c.chunkOrder + 1})
                              </span>
                              <Link
                                href={`/reading-room?id=${c.materialId}&chunk=${c.chunkOrder}`}
                                target="_blank"
                                className="text-gold hover:underline flex items-center gap-1"
                              >
                                <span>Inspect passage</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            </div>
                            <p className="text-mist/90 italic border-l-2 border-gold/30 pl-2">
                              &ldquo;{c.chunkText.slice(0, 220)}...&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isArchive && (
                <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center shrink-0 mt-1 text-xs font-fraunces text-gold">
                  L
                </div>
              )}
            </div>
          );
        })}

        {isAsking && (
          <div className="flex gap-3 justify-start animate-in fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold/30 to-blue-600/30 border border-gold/40 flex items-center justify-center shrink-0 mt-1">
              <Library className="w-4 h-4 text-gold animate-pulse" />
            </div>
            <div className="rounded-2xl p-4 text-xs font-mono text-mist bg-night/80 border border-gold/20 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
              <span>
                Searching Firestore vector index & verifying manuscript citations...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="rounded-2xl border border-gold/25 bg-deep/90 p-3 backdrop-blur-xl shadow-astral">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-3"
        >
          <Search className="w-4 h-4 text-gold-soft shrink-0 ml-2" />
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isAsking}
            placeholder="Ask anything grounded in your library manuscripts..."
            className="flex-1 bg-transparent text-sm text-ivory placeholder:text-mist/50 focus:outline-none font-manrope"
          />
          <Button
            type="submit"
            variant="celestial"
            size="sm"
            disabled={!question.trim() || isAsking}
            className="gap-2 text-night font-semibold shadow-astral px-4 shrink-0"
          >
            {isAsking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Ask</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
