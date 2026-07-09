import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  initTelegram,
  getInitData,
  getTelegramUser,
  isInsideTelegram,
} from '../telegram/initTelegram'
import { useTelegramAuth } from '../telegram/useTelegramAuth'
import { initMonetag, showInterstitial } from '../ads/monetag'

// Ad pacing rules (PRD): interstitial at most every Nth game, and never more
// than once per few minutes.
const INTERSTITIAL_EVERY = 3
const MIN_MS_BETWEEN_ADS = 3 * 60 * 1000

// Global app state. Grows over the phases:
//   Phase 1: telegramUser, initData, insideTelegram
//   Phase 2: firebase auth user + auth status
//   Phase 6: ad frequency counters
const AppContext = createContext(null)

export function AppProvider({ children }) {
  // initData/user are available synchronously from the injected SDK.
  const [telegramUser] = useState(() => getTelegramUser())
  const [initData] = useState(() => getInitData())

  useEffect(() => {
    initTelegram()
    initMonetag() // preload ad SDK (no-op if not configured)
  }, [])

  // Frequency-capped interstitial. Call once per game finished; it decides
  // whether an ad actually shows.
  const gamesEndedRef = useRef(0)
  const lastAdAtRef = useRef(0)
  const maybeShowInterstitial = useCallback(async () => {
    gamesEndedRef.current += 1
    const now = Date.now()
    const dueByCount = gamesEndedRef.current % INTERSTITIAL_EVERY === 0
    const dueByTime = now - lastAdAtRef.current >= MIN_MS_BETWEEN_ADS
    if (dueByCount && dueByTime) {
      lastAdAtRef.current = now
      await showInterstitial()
    }
  }, [])

  const {
    status: authStatus,
    firebaseUser,
    error: authError,
    errorDetail: authErrorDetail,
  } = useTelegramAuth({
    initData,
    telegramUser,
    insideTelegram: isInsideTelegram,
  })

  const value = useMemo(
    () => ({
      insideTelegram: isInsideTelegram,
      telegramUser,
      initData,
      authStatus,
      firebaseUser,
      authError,
      authErrorDetail,
      // Convenient UID for score/leaderboard writes in later phases.
      uid: firebaseUser?.uid ?? null,
      maybeShowInterstitial,
    }),
    [
      telegramUser,
      initData,
      authStatus,
      firebaseUser,
      authError,
      authErrorDetail,
      maybeShowInterstitial,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}
