import * as admin from "firebase-admin";
import { getServerEnv } from "@/lib/env";

function formatPrivateKey(key: string): string {
  return key.replace(/\\n/g, "\n");
}

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const env = getServerEnv();

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: formatPrivateKey(env.FIREBASE_ADMIN_PRIVATE_KEY),
    }),
  });
}

export function getAdminAuth(): admin.auth.Auth {
  return getAdminApp().auth();
}

export function getAdminDb(): FirebaseFirestore.Firestore {
  return getAdminApp().firestore();
}

// Proxies for direct export compatibility
export const adminAuth = {
  verifyIdToken: (...args: Parameters<admin.auth.Auth["verifyIdToken"]>) =>
    getAdminAuth().verifyIdToken(...args),
  verifySessionCookie: (...args: Parameters<admin.auth.Auth["verifySessionCookie"]>) =>
    getAdminAuth().verifySessionCookie(...args),
  createSessionCookie: (...args: Parameters<admin.auth.Auth["createSessionCookie"]>) =>
    getAdminAuth().createSessionCookie(...args),
};

export const adminDb = new Proxy({} as FirebaseFirestore.Firestore, {
  get(_target, prop) {
    const db = getAdminDb();
    const val = (db as any)[prop];
    return typeof val === "function" ? val.bind(db) : val;
  },
});
