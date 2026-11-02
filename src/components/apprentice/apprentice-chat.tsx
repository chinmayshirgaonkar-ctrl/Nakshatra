"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Concept, Subject, Topic, ApprenticeMessage } from "@/lib/types/models";
import { Button } from "@/components/ui/button";
import {
  Send,
  Sparkles,
  ArrowLeft,
  Loader2,
  GraduationCap,
  Eye,
  EyeOff,
  Star,
  CheckCircle2,
  HelpCircle,
  FileText,
} from "lucide-react";

interface ApprenticeChatProps {
  concept: Concept;
  subject?: Subject;
  topic?: Topic;
  language: "en" | "mr";
  onEndLesson: (messages: { role: "user" | "apprentice"; text: string }[]) => Promise<void>;
  onCancel: () => void;
}

export function ApprenticeChat({
  concept,
  subject,
  topic,
  language,
  onEndLesson,
  onCancel,
}: ApprenticeChatProps) {
  const initialGreeting =
    language === "mr"
      ? `नमस्कार गुरुवर्य! मला '${concept.name}' बद्दल अधिक जाणून घ्यायचे आहे. मी या विषयावर एकदम नवीन आहे. आपण मला हे अगदी साध्या आणि सोप्या शब्दांत समजावून सांगू शकाल का?`
      : `Greetings mentor! I am eager to learn about '${concept.name}'. I have never studied this before. Could you explain what it means in simple everyday terms or with an analogy?`;

  const [messages, setMessages] = useState<{ role: "user" | "apprentice"; text: string }[]>([
    { role: "apprentice", text: initialGreeting },
  ]);
  const [inputText, setInputText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showSecretReference, setShowSecretReference] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isReplying]);

  // Focus textarea on load
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isReplying || isEnding) return;

    const userText = inputText.trim();
    setInputText("");

    const newHistory = [...messages, { role: "user" as const, text: userText }];
    setMessages(newHistory);
    setIsReplying(true);

    try {
      const res = await fetch("/api/apprentice/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId: concept.id,
          conversationHistory: newHistory,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to receive Apprentice reply.");
      }

      setMessages((prev) => [...prev, { role: "apprentice", text: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "apprentice",
          text:
            language === "mr"
              ? "क्षमस्व, माझे लक्ष विचलित झाले. आपण काय म्हणालात ते पुन्हा सांगाल का?"
              : "Forgive me, mentor, my thoughts drifted for a moment. Could you repeat that last point?",
        },
      ]);
    } finally {
      setIsReplying(false);
    }
  };

  const handleEndLesson = async () => {
    if (isEnding || isReplying) return;
    setIsEnding(true);
    try {
      await onEndLesson(messages);
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gold/20 bg-deep/80 px-5 py-3.5 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isEnding}
            className="text-mist hover:text-ivory px-2 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs">Exit</span>
          </Button>

          <div className="h-6 w-px bg-gold/15" />

          <div>
            <div className="flex items-center gap-2">
              <span className="font-fraunces text-base font-medium text-ivory">
                {concept.name}
              </span>
              <span className="font-mono text-[10px] text-gold-soft px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20">
                Feynman Mode
              </span>
            </div>
            {topic && (
              <span className="text-[11px] font-mono text-mist block">
                Topic: {topic.name}
              </span>
            )}
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Secret Reference Peek Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSecretReference(!showSecretReference)}
            className="border-gold/25 hover:border-gold text-mist hover:text-ivory text-xs gap-1.5"
          >
            {showSecretReference ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-gold-soft" />
            )}
            <span>{showSecretReference ? "Hide Notes" : "Secret Sheet"}</span>
          </Button>

          {/* End Lesson Button */}
          <Button
            type="button"
            variant="celestial"
            size="sm"
            onClick={handleEndLesson}
            disabled={isEnding || messages.length < 2}
            className="gap-2 text-night font-semibold shadow-astral text-xs"
          >
            {isEnding ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating Gap Report...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {language === "mr" ? "धडा समाप्त करा (Gap Report)" : "End Lesson & Evaluate"}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Secret Reference Sheet (Collapsible) */}
      {showSecretReference && (
        <div className="rounded-xl border border-gold/30 bg-veil/90 p-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 text-xs space-y-2">
          <div className="flex items-center gap-2 text-gold-soft font-mono uppercase tracking-wider text-[10px]">
            <Star className="w-3.5 h-3.5" />
            <span>Mentor&apos;s Secret Canonical Reference Sheet</span>
          </div>
          <div>
            <span className="font-semibold text-ivory">Definition: </span>
            <span className="text-mist">{concept.definition}</span>
          </div>
        </div>
      )}

      {/* Chat Messages Stream */}
      <div className="rounded-2xl border border-gold/20 bg-deep/60 p-4 md:p-6 min-h-[440px] max-h-[560px] overflow-y-auto space-y-4 backdrop-blur-sm">
        {messages.map((m, idx) => {
          const isApprentice = m.role === "apprentice";

          return (
            <div
              key={idx}
              className={`flex gap-3 ${isApprentice ? "justify-start" : "justify-end"}`}
            >
              {isApprentice && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold/30 to-purple-600/40 border border-gold/40 flex items-center justify-center shrink-0 mt-1 shadow-astral">
                  <GraduationCap className="w-4 h-4 text-gold-soft" />
                </div>
              )}

              <div
                className={`max-w-[82%] md:max-w-[72%] rounded-2xl p-4 text-sm font-manrope leading-relaxed ${
                  isApprentice
                    ? "bg-night/80 border border-gold/20 text-ivory rounded-tl-sm shadow-md"
                    : "bg-gold/15 border border-gold/30 text-amber-50 rounded-tr-sm backdrop-blur-md"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wider ${
                      isApprentice ? "text-gold-soft" : "text-amber-300"
                    }`}
                  >
                    {isApprentice
                      ? language === "mr"
                        ? "शिष्य (Apprentice)"
                        : "The Apprentice"
                      : language === "mr"
                      ? "आपण (Mentor)"
                      : "You (Mentor)"}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>

              {!isApprentice && (
                <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center shrink-0 mt-1 text-xs font-fraunces text-gold">
                  M
                </div>
              )}
            </div>
          );
        })}

        {/* Apprentice Typing Indicator */}
        {isReplying && (
          <div className="flex gap-3 justify-start animate-in fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold/30 to-purple-600/40 border border-gold/40 flex items-center justify-center shrink-0 mt-1">
              <GraduationCap className="w-4 h-4 text-gold-soft animate-pulse" />
            </div>
            <div className="rounded-2xl p-4 text-xs font-mono text-mist bg-night/80 border border-gold/20 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
              <span>
                {language === "mr"
                  ? "शिष्य विचार करत आहे..."
                  : "The Apprentice is pondering your explanation..."}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="rounded-2xl border border-gold/25 bg-deep/90 p-3 backdrop-blur-xl shadow-astral space-y-2">
        <textarea
          ref={textareaRef}
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={
            language === "mr"
              ? "आपले स्पष्टीकरण इथे लिहा... (Enter दाबा पाठवण्यासाठी)"
              : "Explain in simple terms as if to a curious student... (Press Enter to send, Shift+Enter for new line)"
          }
          disabled={isReplying || isEnding}
          className="w-full bg-transparent p-2 text-sm text-ivory placeholder:text-mist/50 focus:outline-none resize-none font-manrope"
        />

        <div className="flex items-center justify-between pt-2 border-t border-gold/15">
          <span className="text-[11px] font-mono text-mist/70">
            Feynman tip: If you can&apos;t explain it simply, you haven&apos;t mastered it.
          </span>

          <Button
            type="button"
            variant="celestial"
            size="sm"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isReplying || isEnding}
            className="gap-2 text-night font-semibold shadow-astral px-4"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
