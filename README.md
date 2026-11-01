# Nakshatra (नक्षत्र) — The Celestial Learning OS

> **A personal, single-user learning operating system that turns study material into a living night sky.**
> Concepts are stars; memory retention (FSRS algorithm) dictates brightness. Topics form constellations; AI discovers cross-disciplinary relationships as celestial connections.

---

## 🏛 The "Midnight Observatory" Design System

Nakshatra marries an 19th-century mountaintop astronomical observatory with modern luxury editorial design:

- **Colors:**
  - `--night` (`#0A0D18`): Page backdrop with low-CPU animated starfield.
  - `--deep` (`#11162A`): Primary cards and chambers.
  - `--veil` (`#1A2140`): Raised interactive elements and hovering astrolabes.
  - `--gold` (`#D4AF6A`): Celestial primary accent, buttons, focus rings, shining stars.
  - `--aurora` (`#6FD3C6`): Stable memory retention.
  - `--ember` (`#E07A5F`): Dimming or forgotten stars.
  - *Light Theme ("Parchment"):* Warm archival paper (`#F6F1E7`) with dark antique ink (`#1C1B22`) and burnished gold.
- **Typography:**
  - Headings: *Fraunces* (optical size, warm serif)
  - Interface: *Manrope*
  - Marathi / Devanagari: *Tiro Devanagari Marathi* & *Noto Sans Devanagari*
  - Coordinates / Telemetry: *JetBrains Mono*

---

## 🌌 The Eight Celestial Chambers

1. **Observatory (वेधशाळा):** Today's contemplation ritual, dimming stars needing review, memory metrics.
2. **Library (ग्रंथालय):** Repository of manuscripts, articles, and textbooks.
3. **Reading Room (वाचनकक्ष):** Focused study chamber with 1-min abstracts, deep analyses, mindmaps, and concept star extraction.
4. **The Sky (आकाश):** Interactive 2D/3D constellation map of all ignited concepts and inter-subject links.
5. **Trials (परीक्षा):** Gemini-forged examinations (MCQs, true/false with reasoning, short explanations).
6. **Blank Page (कोरा कागद):** Active free-recall chamber evaluated by AI against original texts.
7. **The Apprentice (शिष्य):** Feynman technique dialog with an inquisitive AI student.
8. **Museum of Mistakes (चुकांचे संग्रहालय):** Repository preserving misunderstandings and mnemonics until resolved.

---

## ⚡ Tech Stack & Architecture

- **Framework:** Next.js (App Router, React 19, TypeScript strict)
- **Styling:** Tailwind CSS + custom re-themed components
- **Motion:** Framer Motion + HTML5 Canvas starfield (pauses when tab is hidden, respects `prefers-reduced-motion`)
- **Database:** Cloud Firestore (Firebase Free Spark Plan)
- **Authentication:** Firebase Auth (Google Sign-In) + HttpOnly Session Cookies
- **AI Core:** Google Gemini (`gemini-2.0-flash` for deep synthesis, `gemini-2.0-flash-lite` for bulk extraction) via `@google/genai` (Server-side only)
- **Spaced Repetition:** `ts-fsrs` (Free Spaced Repetition Scheduler v5)
- **Document Processing:** In-browser `pdfjs-dist` (no paid Cloud Storage required)

---

## 🔒 Security & Single-User Lock

1. Access is restricted to `ALLOWED_EMAIL` via Firebase Session Cookies (`__session`) verified server-side with `firebase-admin`.
2. Next.js middleware redirects unauthorized requests to `/login`.
3. Firestore security rules allow reads/writes only when `request.auth.uid == userId` AND `request.auth.token.email == "<ALLOWED_EMAIL>"`.

---

## 🚀 Getting Started

### 1. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Firebase credentials, Google Gemini API Key, and authorized email:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key_here"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="nakshatra-app.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="nakshatra-app"
NEXT_PUBLIC_FIREBASE_APP_ID="1:..."

FIREBASE_ADMIN_PROJECT_ID="nakshatra-app"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-xxx@nakshatra-app.iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

GEMINI_API_KEY="your_api_key_here"
GEMINI_MODEL="gemini-2.0-flash"
GEMINI_MODEL_LITE="gemini-2.0-flash-lite"
ALLOWED_EMAIL="your-google-email@gmail.com"
```

### 2. Install & Run Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

### 3. Deploying Firestore Security Rules & Indexes

To deploy the rules and indexes to your Firebase project:

```bash
# 1. Log in to Firebase CLI
firebase login

# 2. Select or link your Firebase project
firebase use <your-firebase-project-id>

# 3. Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```
