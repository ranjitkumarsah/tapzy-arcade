import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  initTelegram,
  getInitData,
  getTelegramUser,
  isInsideTelegram,
} from '../telegram/initTelegram'

// Global app state. Grows over the phases:
//   Phase 1: telegramUser, initData, insideTelegram
//   Phase 2: firebase auth user / auth status
//   Phase 6: ad frequency counters
const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [telegramUser, setTelegramUser] = useState(null)
  const [initData, setInitData] = useState('')

  useEffect(() => {
    initTelegram()
    setTelegramUser(getTelegramUser())
    setInitData(getInitData())
  }, [])

  const value = useMemo(
    () => ({
      insideTelegram: isInsideTelegram,
      telegramUser,
      initData,
    }),
    [telegramUser, initData],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}
