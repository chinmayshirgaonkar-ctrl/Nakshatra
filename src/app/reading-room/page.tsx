import * as React from "react";
import { requireUser } from "@/lib/auth/require-user";
import { AppShell } from "@/components/shell/app-shell";
import {
  getMaterialWithChunks,
  getMaterials,
  getConcepts,
  getSubjects,
  getTopics,
} from "@/server/db/repository";
import { ReadingRoomClient } from "@/components/reading-room/reading-room-client";
import { Eye, BookOpen, ArrowRight, Star, Clock, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ReadingRoomPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function ReadingRoomPage({ searchParams }: ReadingRoomPageProps) {
  const user = await requireUser();
  const { id } = await searchParams;

  if (id) {
    const data = await getMaterialWithChunks(user.uid, id);
    if (data) {
      const [concepts, subjects, topics] = await Promise.all([
        getConcepts(user.uid, { materialId: id }),
        getSubjects(user.uid),
        getTopics(user.uid),
      ]);

      const subject = subjects.find((s) => s.id === data.material.subjectId);
      const topic = topics.find((t) => t.id === data.material.topicId);

      return (
        <AppShell>
          <ReadingRoomClient
            material={data.material}
            chunks={data.chunks}
            initialConcepts={concepts}
            subject={subject}
            topic={topic}
          />
        </AppShell>
      );
    }
  }

  // If no material ID specified or not found, list available scrolls
  const [allMaterials, allConcepts, allSubjects] = await Promise.all([
    getMaterials(user.uid),
    getConcepts(user.uid),
    getSubjects(user.uid),
  ]);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gold/15">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
                Deep Study Lectern
              </span>
              <span className="h-1 w-1 rounded-full bg-gold/50" />
              <span className="font-tiro text-xs text-mist">वाचनकक्ष</span>
            </div>
            <h1 className="font-fraunces text-3xl font-light text-ivory">The Reading Room</h1>
          </div>

          <Link href="/library">
            <Button variant="outline" size="sm" className="gap-2">
              <BookOpen className="w-3.5 h-3.5 text-gold" />
              <span>Library Shelves</span>
            </Button>
          </Link>
        </div>

        {allMaterials.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center rounded-[28px] border border-gold/20 bg-deep/60 p-12 md:p-20 text-center backdrop-blur-sm min-h-[440px]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-gold/30 bg-veil shadow-astral mb-6">
              <Eye className="h-9 w-9 text-gold animate-twinkle" />
            </div>

            <span className="font-mono text-xs uppercase tracking-widest text-gold-soft mb-2">
              Sanctuary of Focus
            </span>
            <h2 className="font-fraunces text-2xl md:text-3xl text-ivory mb-3 font-normal max-w-md">
              The Lectern is Bare
            </h2>
            <p className="font-manrope text-sm text-mist max-w-md leading-relaxed mb-8">
              Add study material in your Library to light up the Reading Room with 1-minute abstracts, radial mind maps, ELI10 analogies, and concept star highlighting.
            </p>

            <Link href="/library">
              <Button variant="celestial" size="lg" className="gap-2">
                <BookOpen className="w-4 h-4 text-night" />
                <span>Go to Library</span>
                <ArrowRight className="w-4 h-4 text-night" />
              </Button>
            </Link>
          </div>
        ) : (
          // Shelf of available scrolls to read
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono text-mist">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Select a manuscript scroll to place upon the reading lectern:</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {allMaterials.map((mat) => {
                const matConcepts = allConcepts.filter((c) => c.materialId === mat.id);
                const matSubject = allSubjects.find((s) => s.id === mat.subjectId);

                return (
                  <Link
                    key={mat.id}
                    href={`/reading-room?id=${mat.id}`}
                    className="group relative flex flex-col justify-between rounded-[22px] border border-gold/15 bg-deep/80 p-5 shadow-deep transition-all duration-300 hover:border-gold/40 hover:shadow-astral"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {matSubject && (
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: matSubject.color }}
                            />
                          )}
                          <span className="text-[10px] font-mono uppercase tracking-wider text-mist">
                            {matSubject?.name || "Observatory"}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-gold-soft">
                          {mat.wordCount} words
                        </span>
                      </div>

                      <h3 className="font-fraunces text-lg text-ivory font-normal leading-snug group-hover:text-gold transition-colors line-clamp-2 mb-2">
                        {mat.title}
                      </h3>
                    </div>

                    <div className="pt-4 border-t border-gold/10 mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-gold-soft">
                        <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                        <span>{matConcepts.length} stars</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-mono text-mist group-hover:text-gold transition-colors">
                        <span>Open Lectern</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
