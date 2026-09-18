/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { api, type ContentBundle } from './api'

interface SessionState {
  id: number | null
  mode: string
  variant: string
}

interface AppContextValue {
  content: ContentBundle | null
  session: SessionState
  startSession: (mode: string, variant: string) => Promise<void>
  signal: (payload: Record<string, unknown>) => void
  evidenceTitle: (ref: string) => string
}

const AppContext = createContext<AppContextValue>(null as unknown as AppContextValue)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<ContentBundle | null>(null)
  const [session, setSession] = useState<SessionState>({ id: null, mode: 'school', variant: 'adaptive' })

  useEffect(() => {
    api.content().then(setContent).catch(() => {})
  }, [])

  const startSession = async (mode: string, variant: string) => {
    const s = await api.createSession(mode, variant)
    setSession({ id: s.session_id, mode, variant: s.variant })
  }

  const signal = (payload: Record<string, unknown>) => {
    if (session.id == null) return
    api.signal({ session_id: session.id, ...payload }).catch(() => {})
  }

  const evidenceTitle = (ref: string) => {
    if (!content) return ref
    const ev = content.evidence.find((e) => e.id === ref)
    return ev ? `${ev.publisher}·${ev.title}` : ref
  }

  return (
    <AppContext.Provider value={{ content, session, startSession, signal, evidenceTitle }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
