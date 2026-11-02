import fs from "fs";
import path from "path";

console.log("🛡️ Running Nakshatra Security & Perimeter Verification Suite...\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Verify Firestore Rules
console.log("1. Inspecting firestore.rules perimeter:");
const rulesPath = path.resolve("firestore.rules");
assert(fs.existsSync(rulesPath), "firestore.rules file exists");

const rulesContent = fs.readFileSync(rulesPath, "utf-8");
assert(
  rulesContent.includes('request.auth.token.email == "chinmay.shirgaonkar@gmail.com"'),
  "Rules explicitly restrict access to chinmay.shirgaonkar@gmail.com"
);
assert(
  rulesContent.includes("request.auth.uid == userId"),
  "Rules enforce request.auth.uid == userId"
);
assert(
  rulesContent.includes("request.auth.token.email_verified == true"),
  "Rules require email_verified == true"
);
assert(
  rulesContent.includes("allow read, write: if false;"),
  "Rules enforce strict default-deny outside users/{userId}"
);

// 2. Secret Leak Inspection
console.log("\n2. Scanning for potential client-bundle secret leaks:");
const clientDirs = ["src/components", "src/lib/astronomy", "src/lib/fsrs"];
const forbiddenTokens = ["FIREBASE_ADMIN_PRIVATE_KEY", "FIREBASE_ADMIN_CLIENT_EMAIL", "GEMINI_API_KEY"];

let leakFound = false;
function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      scanDir(full);
    } else if (/\.(tsx|ts|js|jsx)$/.test(f.name)) {
      const code = fs.readFileSync(full, "utf-8");
      for (const token of forbiddenTokens) {
        if (code.includes(`process.env.${token}`) || code.includes(`process.env.NEXT_PUBLIC_${token}`)) {
          console.error(`Leak detected in ${full} for token ${token}`);
          leakFound = true;
        }
      }
    }
  }
}
for (const d of clientDirs) {
  scanDir(d);
}
assert(!leakFound, "No server secret keys referenced in client components or browser libraries");

// 3. AI Route maxDuration Inspection
console.log("\n3. Verifying Vercel maxDuration on AI Routes:");
const aiRoutes = [
  "src/app/api/ai/extract-concepts/route.ts",
  "src/app/api/ai/reading-room/summary-stream/route.ts",
  "src/app/api/ai/reading-room/content/route.ts",
  "src/app/api/ai/reading-room/selection/route.ts",
  "src/app/api/ai/transcribe-vision/route.ts",
  "src/app/api/trials/generate/route.ts",
  "src/app/api/trials/grade-short-answer/route.ts",
  "src/app/api/blank-page/evaluate/route.ts",
  "src/app/api/apprentice/chat/route.ts",
  "src/app/api/apprentice/end-lesson/route.ts",
  "src/app/api/archive/ask/route.ts",
];

for (const r of aiRoutes) {
  const full = path.resolve(r);
  assert(fs.existsSync(full), `Route file exists: ${r}`);
  if (fs.existsSync(full)) {
    const content = fs.readFileSync(full, "utf-8");
    assert(
      content.includes("export const maxDuration = 60"),
      `Route ${path.basename(path.dirname(r))} declares maxDuration = 60`
    );
  }
}

// 4. Rate Limiter Inspection
console.log("\n4. Verifying DAILY_AI_CALL_LIMIT rate limiter:");
const limiterFile = path.resolve("src/server/ai/rate-limiter.ts");
assert(fs.existsSync(limiterFile), "AI rate limiter exists in src/server/ai/rate-limiter.ts");
const limiterContent = fs.readFileSync(limiterFile, "utf-8");
assert(
  limiterContent.includes("DAILY_AI_CALL_LIMIT"),
  "Rate limiter binds to DAILY_AI_CALL_LIMIT"
);
assert(
  limiterContent.includes("runTransaction"),
  "Rate limiter uses atomic Firestore transaction"
);

console.log(`\n========================================`);
console.log(`Audit Complete: ${passed} passed, ${failed} failed.`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
