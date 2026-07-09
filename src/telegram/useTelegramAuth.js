import { useEffect, useState } from 'react'
import { signInWithCustomToken } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase/firebaseConfig'

// Auth status values:
//   'loading'       — verifying initData / signing in
//   'authenticated' — Firebase session established, tied to Telegram ID
//   'dev'           — running outside Telegram or Firebase not configured (local dev)
//   'error'         — verification or sign-in failed
export function useTelegramAuth({ initData, telegramUser, insideTelegram }) {
  const [status, setStatus] = useState('loading')
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [error, setError] = useState(null)
  const [errorDetail, setErrorDetail] = useState(null)

  useEffect(() => {
    let cancelled = false

    // Local dev: no Telegram context or no Firebase config → skip real auth.
    if (!insideTelegram || !initData || !isFirebaseConfigured) {
      setStatus('dev')
      return
    }

    async function run() {
      try {
        const res = await fetch('/api/verifyTelegramAuth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          const err = new Error(body.reason || body.error || `HTTP ${res.status}`)
          err.detail = body // full diagnostics (codeVersion, diag, ...)
          throw err
        }

        const { token } = await res.json()
        const credential = await signInWithCustomToken(auth, token)
        if (cancelled) return

        // Upsert the user profile. Only stamp createdAt on first creation.
        const ref = doc(db, 'users', credential.user.uid)
        const snapshot = await getDoc(ref)
        const profile = {
          telegramId: telegramUser?.id ?? null,
          firstName: telegramUser?.first_name ?? '',
          username: telegramUser?.username ?? '',
          lastSeen: serverTimestamp(),
        }
        if (!snapshot.exists()) profile.createdAt = serverTimestamp()
        await setDoc(ref, profile, { merge: true })

        if (cancelled) return
        setFirebaseUser(credential.user)
        setStatus('authenticated')
      } catch (err) {
        if (cancelled) return
        setError(err.message)
        setErrorDetail(err.detail || null)
        setStatus('error')
      }
    }

    run()
    return () => {
      cancelled = true
    }
    // Re-run only if the identity inputs change.
  }, [initData, insideTelegram, telegramUser])

  return { status, firebaseUser, error, errorDetail }
}
