import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  initTelegram,
  getInitData,
  getTelegramUser,
  isInsideTelegram,
} from '../telegram/initTelegram'
import { useTelegramAuth } from '../telegram/useTelegramAuth'

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
    }),
    [telegramUser, initData, authStatus, firebaseUser, authError, authErrorDetail],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}
