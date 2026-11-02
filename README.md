# Nakshatra — The Celestial Learning OS

> **A personal, single-user learning operating system that turns study material into a living night sky.**  
> Concepts are stars; spaced repetition retention (FSRS 5.0) dictates brightness. Topics cluster into constellations; AI discovers cross-disciplinary connections.

---

## 🏛 The "Midnight Observatory" Design System

Nakshatra marries an 19th-century mountaintop astronomical observatory with modern luxury editorial design:

- **Celestial Dark Theme:**
  - `--night` (`#0A0D18`): Deep void backdrop with low-overhead canvas starfield.
  - `--deep` (`#11162A`): Primary cards, drawers, and modal chambers.
  - `--veil` (`#1A2140`): Raised interactive elements and astrolabe controls.
  - `--gold` (`#E6AF2E` / `#D4AF6A`): Celestial primary accent, focus rings, shining stars.
  - `--aurora` (`#6FD3C6`): Stable memory retention (FSRS $R \ge 0.7$).
  - `--ember` (`#E07A5F` / `#EF4444`): Dimming or fading stars requiring review.
- **Parchment Light Theme:** Warm archival paper (`#F6F1E7`) with dark antique ink (`#1C1B22`) and burnished gold.
- **Typography:**
  - Headings: *Fraunces* (optical size, warm serif)
  - Interface: *Manrope*
  - Coordinates & Telemetry: *JetBrains Mono*
- **Responsive Navigation:**
  - Desktop: Collapsible Midnight Astrolabe sidebar with quick-access commands.
  - Mobile: Native bottom navigation bar with haptic tap targets for one-handed operation.

---

## 🌌 The Celestial Chambers

1. **Observatory:** Today's contemplation ritual, 30-day astronomical moon phase streak, fading stars quick-review, weekly study time chart, and AI cross-subject thread.
2. **The Library:** Multi-modal knowledge ingestion (raw text, PDF with Gemini Vision OCR fallback, and distraction-free URL article scraping).
3. **The Reading Room:** Magazine-quality study page with streaming 1-min / 5-min / deep summaries, expandable key points, glossary, "Explain like I'm 10", interactive SVG radial mind map, and floating text selection actions ("Explain this", "Make a concept star", "Quiz me on this").
4. **The Sky:** Full-screen, zoomable, pannable 60 FPS HTML5 Canvas night sky. Star size equals importance; brightness/glow equals FSRS retrievability ($R$). Fading stars gently flicker; hovering displays retention telemetry; clicking opens the celestial action drawer.
5. **The Trials:** Socratic examination engine (MCQ, True/False with reasoning, fill-in-the-blank, and Gemini rubric-graded short explanations). Answers dynamically update concept FSRS cards.
6. **Museum of Mistakes:** Gallery of framed missteps and memory hooks. "Re-trial my mistakes" builds custom trials from unresolved mistakes until solved twice.
7. **Blank Page:** Unassisted active recall on digital parchment with optional timer. Gemini cross-examines recall against source materials with green (remembered), amber (partial), and ember (misconception) text annotations.
8. **The Apprentice:** Feynman technique dialog chamber where Gemini roleplays an eager, sharp student who **never lectures** the user, spots contradictions, and produces a structured Gap Report with follow-up study inquiries.
9. **Ask the Archive:** Strictly grounded vector retrieval across personal notes with verifiable inline citations.

---

## 🔒 Security & Perimeter Architecture

- **Single-User Lock:** All access is strictly locked to `ALLOWED_EMAIL` (`chinmay.shirgaonkar@gmail.com`).
- **Session Verification:** Firebase Auth tokens are exchanged for server-signed HttpOnly Session Cookies (`__session`) verified via `firebase-admin`.
- **Zero Client Leaks:** Neither `FIREBASE_ADMIN_PRIVATE_KEY` nor `GEMINI_API_KEY` are ever sent to client bundles (verified by automated build audit).
- **Daily AI Quota Limiter:** `DAILY_AI_CALL_LIMIT` is enforced via atomic Firestore transactions per user per day.
- **Firestore Security Rules:** All documents outside `/users/{userId}` are denied. All user chambers require `request.auth.uid == userId` and matching email.

---

## ⚙️ Environment Variables

Create `.env.local` in the project root:

```env
# Client-Side Firebase Configuration (Publicly safe)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="nakshatra-xxxxx.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="nakshatra-xxxxx"
NEXT_PUBLIC_FIREBASE_APP_ID="1:xxxx:web:xxxx"

# Server-Side Firebase Admin Configuration (Confidential - Server Only)
FIREBASE_ADMIN_PROJECT_ID="nakshatra-xxxxx"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-xxx@nakshatra-xxxxx.iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Gemini AI Studio Configuration (Confidential - Server Only)
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-2.0-flash"
GEMINI_MODEL_LITE="gemini-2.0-flash-lite"

# Perimeter Lock & Rate Limits
ALLOWED_EMAIL="chinmay.shirgaonkar@gmail.com"
DAILY_AI_CALL_LIMIT="100"
```

> [!IMPORTANT]
> The `FIREBASE_ADMIN_PRIVATE_KEY` must preserve its `\n` linebreaks or raw RSA private key format.

---

## 🛠 Local Setup & Development

```bash
# 1. Clone repository & install dependencies
git clone <repo-url>
cd Nakshatra
npm install

# 2. Verify security perimeter & rate limiter
node scripts/verify-security.mjs

# 3. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 🚀 Deploying to Vercel

### Step 1: Push Repository to GitHub
Push your committed codebase to your private GitHub repository:

```bash
git remote add origin https://github.com/<your-username>/nakshatra.git
git push -u origin master
```

### Step 2: Configure Vercel Project
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New Project** and import your `nakshatra` repository.
3. Framework Preset: **Next.js**.
4. In **Environment Variables**, add all keys from your `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY` *(paste the exact private key)*
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (`gemini-2.0-flash`)
   - `GEMINI_MODEL_LITE` (`gemini-2.0-flash-lite`)
   - `ALLOWED_EMAIL` (`chinmay.shirgaonkar@gmail.com`)
   - `DAILY_AI_CALL_LIMIT` (`100`)
5. Click **Deploy**.

---

## 🔑 Firebase Configuration for Production

### 1. Add Vercel Domain to Firebase Auth Authorized Domains
Google Sign-In will reject authentication if your Vercel URL is not whitelisted:
1. Open the [Firebase Console](https://console.firebase.google.com).
2. Select your project (`nakshatra-xxxxx`).
3. Navigate to **Build** > **Authentication** > **Settings** tab.
4. Under **Authorized domains**, click **Add domain**.
5. Enter your Vercel domain (e.g. `nakshatra.vercel.app` and any custom domains).
6. Click **Save**.

### 2. Deploying Firestore Security Rules
You can deploy `firestore.rules` via the CLI or directly in the Firebase Console:

#### Option A: Firebase Console (Quickest)
1. In Firebase Console, go to **Build** > **Firestore Database** > **Rules** tab.
2. Replace the editor contents with the code from `firestore.rules`:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       function isAllowedUser(userId) {
         return request.auth != null &&
                request.auth.uid == userId &&
                request.auth.token.email == "chinmay.shirgaonkar@gmail.com" &&
                request.auth.token.email_verified == true;
       }

       match /users/{userId} {
         allow read, write: if isAllowedUser(userId);
         match /{document=**} {
           allow read, write: if isAllowedUser(userId);
         }
       }

       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```
3. Click **Publish**.

#### Option B: Firebase CLI
```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```

---

## 🧪 Verification & Health Check

Run the automated test suite before any release:

```bash
# Verify security boundaries, maxDuration & rate limiter
node scripts/verify-security.mjs

# TypeScript compilation check
npx tsc --noEmit

# Next.js production build test
npm run build
```
