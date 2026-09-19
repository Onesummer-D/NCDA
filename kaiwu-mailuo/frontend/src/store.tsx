/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { api, type ContentBundle } from './api'

const SESSION_KEY = 'kaiwu_session_v1'

interface SessionState {
  id: number | null
  mode: string
  variant: string
}

/** 现场刷新不丢研学进度：会话持久化到 localStorage */
function loadSession(): SessionState {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s && typeof s.id === 'number') return s
    }
  } catch { /* 损坏则视为未开始 */ }
  return { id: null, mode: 'school', variant: 'adaptive' }
}

interface AppContextValue {
  content: ContentBundle | null
  session: SessionState
  startSession: (mode: string, variant: string) => Promise<void>
  signal: (payload: Record<string, unknown>) => void
  evidenceTitle: (ref: string) => string
  qaSeed: string | null           // 预置到问答页的问题（跨页跳转用）
  setQaSeed: (q: string | null) => void
  craftQi: number | null          // 预置到造物问的问题序号
  setCraftQi: (i: number | null) => void
}

const AppContext = createContext<AppContextValue>(null as unknown as AppContextValue)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<ContentBundle | null>(null)
  const [session, setSession] = useState<SessionState>(loadSession)
  const [qaSeed, setQaSeed] = useState<string | null>(null)
  const [craftQi, setCraftQi] = useState<number | null>(null)

  useEffect(() => {
    api.content().then(setContent).catch(() => {})
  }, [])

  const startSession = async (mode: string, variant: string) => {
    const s = await api.createSession(mode, variant)
    const next: SessionState = { id: s.session_id, mode, variant: s.variant }
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(next)) } catch { /* 隐私模式忽略 */ }
    setSession(next)
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
    <AppContext.Provider value={{ content, session, startSession, signal, evidenceTitle, qaSeed, setQaSeed, craftQi, setCraftQi }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
