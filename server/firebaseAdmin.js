// Firebase Admin initialization for serverless functions. Lives outside /api so
// Vercel bundles it into functions rather than deploying it as its own endpoint.
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function ensureApp() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    initializeApp({ credential: cert(serviceAccount) })
  }
}

export function getDb() {
  ensureApp()
  return getFirestore()
}
