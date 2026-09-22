export type NodeEra = 'ancient' | 'modern'

export interface CraftQuestion {
  id: string; code: string; title: string; essence: string
  ancient_answer_short: string; modern_answer_short: string; why_changed: string
}
export interface ProcessNode {
  id: string; era: NodeEra; stage: string; title: string; subtitle: string
  location: string; time_label: string; summary: string; details: string[]
  question_ids: string[]; evidence_ids: string[]; is_observation_point: boolean
}
export interface ObservationTask {
  id: string; node_id: string; mode: 'choice' | 'observe'; prompt: string
  options: string[]; correct_index: number | null
  gap_topic_on_wrong: string | null; expected_signal_correct: string | null
  source_refs: string[]
}export interface Explanation {
  id: string; title: string; body: string; question_id: string
  node_ids: string[]; gap_topics: string[]; depth: string; source_refs: string[]
}
export interface CurriculumLink {
  id: string; node_id: string; subject: string; concept: string; hook: string
  verification_source: string; needs_verification: number
}
export interface Evidence { id: string; title: string; publisher: string; date: string; url: string; note: string }
export interface RelationEdge {
  id: string; from_id: string; to_id: string; type: string
  relation_type: string; confidence: string; note: string
  evidence_ids: string[]
}
export interface ContentBundle {
  questions: CraftQuestion[]; nodes: ProcessNode[]; edges: RelationEdge[]; tasks: ObservationTask[]
  curriculum: CurriculumLink[]; explanations: Explanation[]; evidence: Evidence[]
}
export interface RecoCard {
  id: string; title: string; body: string; depth: string; node_ids: string[]
  source_refs: string[]; score: number; reasons: string[]
}
export interface RecoResponse {
  variant: 'fixed' | 'adaptive'; unresolved_gaps: string[]; resolved_gaps: string[]
  recommendations: RecoCard[]; next_node: string | null
}
export interface SpectrumResponse {
  nodes: { id: string; era: NodeEra; stage: string; title: string }[]
  states: Record<string, 'unseen' | 'exposed' | 'verified' | 'gap_detected'>
  key_changes: string[]
}
export interface TeacherSummary {
  sessions: number; qa_count: number
  tasks: { task_id: string; node_id: string; prompt: string; reached: number; answered: number; first_correct: number; first_wrong: number }[]
  top_gap_topics: { gap_topic: string; n: number }[]
  advice: string
  advice_source?: 'ai' | 'rule'
  advice_pending?: boolean
}

export interface QaMeta {
  hit: boolean; answer?: string
  question_hint?: string; source_refs?: string[]; suggestions?: string[]
}

/**
 * 问答（DeepSeek 流式）：后端以 SSE 推送 meta → delta… → done。
 * onMeta：命中的证据来源/未收录标记等元信息（可能出现多次，以后到的为准）；
 * onDelta：追加的增量回答文本。
 */
async function qaStream(query: string, sessionId: number | undefined, contextQuestionId: string | null,
                        onMeta?: (m: QaMeta) => void, onDelta?: (d: string) => void): Promise<void> {
  const res = await fetch('/api/qa', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, session_id: sessionId, context_question_id: contextQuestionId }),
  })
  if (!res.ok || !res.body) throw new Error(`${res.status}`)
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let idx: number
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const raw = buf.slice(0, idx)
      buf = buf.slice(idx + 2)
      if (!raw.startsWith('data: ')) continue
      try {
        const evt = JSON.parse(raw.slice(6))
        if (evt.meta) onMeta?.(evt.meta)
        else if (evt.delta) onDelta?.(evt.delta)
      } catch { /* 忽略不完整帧 */ }
    }
  }
}

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json() as Promise<T>
}

/* ================= 静态演示模式（GitHub Pages 等） =================
 * 纯静态托管没有 FastAPI 后端：content.json 内置在页面里，
 * 会话/认知信号/开物谱状态全部降级到 localStorage 本地模拟；
 * 问答助手需要 DeepSeek 服务，演示模式下如实告知未连接。
 */
export const STATIC_DEMO = { enabled: false }
export const DEMO_STATES_KEY = 'kaiwu_demo_states_v1'

function demoStates(): Record<string, SpectrumResponse['states'][string]> {
  const allowed = ['unseen', 'exposed', 'verified', 'gap_detected'] as const
  type State = (typeof allowed)[number]
  try {
    const raw = JSON.parse(localStorage.getItem(DEMO_STATES_KEY) ?? '{}') as Record<string, string>
    const out: Partial<Record<string, State>> = {}
    for (const [k, v] of Object.entries(raw)) {
      if ((allowed as readonly string[]).includes(v)) out[k] = v as State
    }
    return out as Record<string, State>
  } catch { return {} }
}
function saveDemoStates(s: Record<string, SpectrumResponse['states'][string]>) {
  try { localStorage.setItem(DEMO_STATES_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}
function demoRecordSignal(payload: Record<string, unknown>) {
  const nid = payload.node_id as string | undefined
  if (!nid) return
  const s = demoStates()
  if (payload.signal_type === 'visit') {
    if (!s[nid] || s[nid] === 'unseen') s[nid] = 'exposed'
  } else if (payload.signal_type === 'task_answer') {
    if (payload.correct === true || payload.correct === 1) s[nid] = 'verified'
    else if (s[nid] !== 'verified') s[nid] = 'gap_detected'
  }
  saveDemoStates(s)
}

/** 把仓库原始 content.json（data/content.json）映射为后端 /api/content 的形状 */
function mapRawContent(raw: Record<string, any>): ContentBundle {
  return {
    questions: raw.craft_questions ?? [],
    nodes: raw.process_nodes ?? [],
    edges: raw.relation_edges ?? [],
    tasks: raw.observation_tasks ?? [],
    curriculum: raw.curriculum_links ?? [],
    explanations: raw.explanations ?? [],
    evidence: raw.evidence_sources ?? [],
  }
}

export const api = {
  content: () =>
    fetch('/api/content')
      .then((r) => j<ContentBundle>(r))
      .catch(async () => {
        // 无后端 → 静态演示模式：加载内置内容库
        const raw = await fetch(`${import.meta.env.BASE_URL}content.json`).then((r) => r.json())
        STATIC_DEMO.enabled = true
        return mapRawContent(raw)
      }),
  createSession: (mode: string, variant: string, grade?: string) => {
    if (STATIC_DEMO.enabled) return Promise.resolve({ session_id: -1, variant })
    return fetch('/api/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, variant, grade }),
    })
      .then((r) => j<{ session_id: number; variant: string }>(r))
      .catch(() => { STATIC_DEMO.enabled = true; return { session_id: -1, variant } })
  },
  signal: (payload: Record<string, unknown>) => {
    if (STATIC_DEMO.enabled) { demoRecordSignal(payload); return Promise.resolve() }
    return fetch('/api/signal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(() => undefined).catch(() => { demoRecordSignal(payload) })
  },
  recommend: (sessionId: number, nodeId?: string) => {
    if (STATIC_DEMO.enabled) {
      return import('./apiDemo').then((m) => m.demoRecommend(nodeId))
    }
    return fetch(`/api/recommend/${sessionId}${nodeId ? `?node_id=${nodeId}` : ''}`).then((r) => j<RecoResponse>(r))
      .catch(() => import('./apiDemo').then((m) => m.demoRecommend(nodeId)))
  },
  qa: (query: string, sessionId: number | undefined, contextQuestionId?: string | null,
       onMeta?: (m: QaMeta) => void, onDelta?: (d: string) => void) => {
    if (STATIC_DEMO.enabled) {
      onMeta?.({
        hit: false,
        answer: '当前是静态演示版，没有连接问答服务。完整版请在研学现场的本地系统体验「问个开物」。',
      })
      return Promise.resolve()
    }
    return qaStream(query, sessionId, contextQuestionId ?? null, onMeta, onDelta)
  },
  spectrum: (sessionId: number) => {
    if (STATIC_DEMO.enabled) {
      return Promise.resolve({ nodes: [], states: demoStates(), key_changes: [] })
    }
    return fetch(`/api/spectrum/${sessionId}`).then((r) => j<SpectrumResponse>(r))
      .catch(() => ({ nodes: [], states: demoStates(), key_changes: [] }))
  },
  finish: (sessionId: number) => {
    if (STATIC_DEMO.enabled) return Promise.resolve({ ok: true })
    return fetch(`/api/session/${sessionId}/finish`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"finished":true}',
    }).then((r) => j<{ ok: boolean }>(r)).catch(() => ({ ok: true }))
  },
  teacher: () => {
    if (STATIC_DEMO.enabled) {
      return Promise.resolve({
        sessions: 0, qa_count: 0, tasks: [], top_gap_topics: [],
        advice: '当前为静态演示版，未连接后端数据。请在研学现场运行本地系统查看真实班级数据。',
        advice_source: 'rule' as const,
      })
    }
    return fetch('/api/teacher/summary').then((r) => j<TeacherSummary>(r))
  },
}
