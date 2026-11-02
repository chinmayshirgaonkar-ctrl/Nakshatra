"use client";

import * as React from "react";
import { ExamCountdownItem } from "@/lib/types/models";
import { Calendar, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ExamCountdownCardProps {
  exams: ExamCountdownItem[];
}

export function ExamCountdownCard({ exams }: ExamCountdownCardProps) {
  if (exams.length === 0) return null;

  return (
    <div className="rounded-[24px] border border-gold/20 bg-deep/70 p-6 md:p-8 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gold-soft" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
            Upcoming Milestones
          </span>
        </div>
        <span className="text-xs font-mono text-mist">
          {exams.length} Exam{exams.length === 1 ? "" : "s"} Scheduled
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {exams.map((item) => {
          const isUrgent = item.daysRemaining <= 7 && item.daysRemaining >= 0;
          const isToday = item.daysRemaining === 0;

          return (
            <div
              key={item.topicId}
              className={`rounded-2xl border p-4 space-y-3 transition-colors ${
                isToday
                  ? "border-ember bg-ember/15"
                  : isUrgent
                  ? "border-gold/40 bg-gold/10"
                  : "border-gold/15 bg-veil/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 border"
                    style={{
                      borderColor: `${item.subjectColor}40`,
                      backgroundColor: `${item.subjectColor}15`,
                      color: item.subjectColor,
                    }}
                  >
                    {item.subjectName}
                  </span>
                  <h4 className="font-fraunces text-base text-ivory font-normal leading-snug">
                    {item.topicName}
                  </h4>
                </div>

                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    isToday
                      ? "bg-ember text-night animate-pulse"
                      : isUrgent
                      ? "bg-gold text-night"
                      : "bg-veil text-mist"
                  }`}
                >
                  {isToday
                    ? "Today!"
                    : item.daysRemaining === 1
                    ? "Tomorrow"
                    : item.daysRemaining > 0
                    ? `${item.daysRemaining}d left`
                    : "Past"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gold/10 text-xs">
                <span className="text-[11px] font-mono text-mist">
                  {new Date(item.examDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>

                <Link href={`/trials?topicId=${item.topicId}&count=10`}>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-gold hover:text-gold-soft p-0">
                    <span>Prep</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
