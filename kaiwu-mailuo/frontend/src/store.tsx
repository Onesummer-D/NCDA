/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { api, type ContentBundle } from './api'

const SESSION_KEY = 'kaiwu_session_v1'
const USER_KEY = 'kaiwu_user_v1'
const FAV_KEY = 'kaiwu_fav_v1'
const VISIT_KEY = 'kaiwu_visit_v1'

interface SessionState {
  id: number | null
  mode: string
  variant: string
}

export interface UserInfo {
  name: string
  role: 'student' | 'teacher'
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

function loadUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function loadFavs(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

interface AppContextValue {
  content: ContentBundle | null
  session: SessionState
  startSession: (mode: string, variant: string) => Promise<void>
  signal: (payload: Record<string, unknown>) => Promise<void>
  evidenceTitle: (ref: string) => string
  user: UserInfo | null
  setUser: (u: UserInfo | null) => void
  craftQi: number | null
  setCraftQi: (i: number | null) => void
  qaContext: string | null
  setQaContext: (id: string | null) => void
  favorites: string[]
  toggleFav: (nodeId: string) => void
  walkNodeId: string | null
  setWalkNodeId: (id: string | null) => void
  visitStart: number | null   // 本次研学开始时间戳（海报算游览时长用）
}

const AppContext = createContext<AppContextValue>(null as unknown as AppContextValue)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<ContentBundle | null>(null)
  const [session, setSession] = useState<SessionState>(loadSession)
  const [user, setUserState] = useState<UserInfo | null>(loadUser)
  const [craftQi, setCraftQi] = useState<number | null>(null)
  const [qaContext, setQaContext] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>(loadFavs)
  const [walkNodeId, setWalkNodeId] = useState<string | null>(null)
  const [visitStart, setVisitStart] = useState<number | null>(() => {
    const v = Number(localStorage.getItem(VISIT_KEY))
    return Number.isFinite(v) && v > 0 ? v : null
  })

  useEffect(() => {
    api.content().then(setContent).catch(() => {})
  }, [])

  // 校验本地会话仍存在（后端重建库后失效则重置）
  useEffect(() => {
    if (session.id == null) return
    api.spectrum(session.id).catch(() => {
      try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
      setSession({ id: null, mode: 'school', variant: 'adaptive' })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startSession = async (mode: string, variant: string) => {
    const s = await api.createSession(mode, variant)
    const next: SessionState = { id: s.session_id, mode, variant: s.variant }
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(next))
      localStorage.setItem(VISIT_KEY, String(Date.now()))
    } catch { /* 隐私模式忽略 */ }
    setSession(next)
    setVisitStart(Date.now())
  }

  const signal = (payload: Record<string, unknown>): Promise<void> => {
    if (session.id == null) return Promise.resolve()
    return api.signal({ session_id: session.id, ...payload }).catch(() => {})
  }

  const evidenceTitle = (ref: string) => {
    if (!content) return ref
    const ev = content.evidence.find((e) => e.id === ref)
    if (!ev) return ref
    // 标题里已含机构名时不再重复前缀
    return ev.title.includes(ev.publisher) ? ev.title : `${ev.publisher}·${ev.title}`
  }

  const setUser = (u: UserInfo | null) => {
    try {
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
      else localStorage.removeItem(USER_KEY)
    } catch { /* ignore */ }
    setUserState(u)
  }

  const toggleFav = (nodeId: string) => {
    setFavorites((f) => {
      const next = f.includes(nodeId) ? f.filter((x) => x !== nodeId) : [...f, nodeId]
      try { localStorage.setItem(FAV_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  return (
    <AppContext.Provider value={{
      content, session, startSession, signal, evidenceTitle,
      user, setUser, craftQi, setCraftQi, qaContext, setQaContext,
      favorites, toggleFav, walkNodeId, setWalkNodeId, visitStart,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
