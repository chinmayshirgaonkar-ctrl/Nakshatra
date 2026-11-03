"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { getClientAuth, googleProvider } from "@/lib/firebase/client";
import { Compass, Star, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("from") || "/observatory";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Trigger Firebase Client Google Sign-In
      const result = await signInWithPopup(getClientAuth(), googleProvider);
      const idToken = await result.user.getIdToken();

      // 2. Exchange ID Token for httpOnly session cookie
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Access denied to observatory chambers.");
      }

      // 3. Success -> Proceed into observatory
      router.push(returnTo);
      router.refresh();
    } catch (err: any) {
      console.error("Authentication error:", err);
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup closed before completion.");
      } else if (err?.code === "auth/unauthorized-domain") {
        setError(
          "This Vercel domain is not yet whitelisted in Firebase. Please add this domain to Firebase Console → Authentication → Settings → Authorized domains."
        );
      } else if (err?.message?.includes("Client environment validation failed")) {
        setError(
          "Environment Variables missing in Vercel: Please paste your .env.local keys into Vercel Project Settings → Environment Variables, then click Redeploy."
        );
      } else {
        setError(err?.message || "Failed to enter the observatory.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 md:p-12 overflow-hidden">
      {/* Decorative celestial background rings */}
      <div className="pointer-events-none absolute h-[600px] w-[600px] md:h-[800px] md:w-[800px] rounded-full border border-gold/10 -top-40 -left-40 animate-pulse-slow" />
      <div className="pointer-events-none absolute h-[500px] w-[500px] md:h-[700px] md:w-[700px] rounded-full border border-gold/5 -bottom-20 -right-20 animate-pulse-slow" />

      {/* Main Sanctuary Portal Card */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-gold/25 bg-deep/90 p-8 md:p-12 shadow-2xl backdrop-blur-2xl">
        {/* Brass Header Badge */}
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-gold/15">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/40 bg-veil shadow-astral">
              <Compass className="h-6 w-6 text-gold animate-twinkle" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
                Private Sanctuary
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold/20 bg-veil text-[11px] font-mono text-gold-soft">
            <Star className="w-3 h-3 text-gold fill-gold" />
            <span>Sole Astronomer</span>
          </div>
        </div>

        {/* Portal Titles */}
        <div className="space-y-3 mb-8">
          <h1 className="font-fraunces text-3xl md:text-4xl font-normal tracking-tight text-ivory">
            The Midnight Observatory
          </h1>
          <p className="font-manrope text-sm text-mist leading-relaxed">
            Every concept you learn is a star. Over time, forgotten stars dim; recall rekindles their light. Step inside to survey your living constellation.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-ember/30 bg-ember/10 p-4 text-xs text-ember">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Sanctuary Lock Enforced</p>
              <p className="text-mist leading-normal">{error}</p>
            </div>
          </div>
        )}

        {/* Entry Actions */}
        <div className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="celestial"
            size="lg"
            className="w-full h-12 text-base justify-center gap-3 text-night font-medium"
          >
            {/* Google G SVG */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? "Unlocking Portal..." : "Sign in with Google"}</span>
          </Button>
        </div>

        {/* Footer info note */}
        <div className="mt-8 pt-6 border-t border-gold/10 text-center">
          <p className="text-[11px] text-mist/70 font-manrope">
            Protected by Firebase Auth and Google Gemini.
            <br />
            Configured for solitary exploration.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-night" />}>
      <LoginForm />
    </React.Suspense>
  );
}
