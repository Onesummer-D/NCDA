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

export const api = {
  content: () => fetch('/api/content').then((r) => j<ContentBundle>(r)),
  createSession: (mode: string, variant: string, grade?: string) =>
    fetch('/api/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, variant, grade }),
    }).then((r) => j<{ session_id: number; variant: string }>(r)),
  signal: (payload: Record<string, unknown>) =>
    fetch('/api/signal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(() => undefined),
  recommend: (sessionId: number, nodeId?: string) =>
    fetch(`/api/recommend/${sessionId}${nodeId ? `?node_id=${nodeId}` : ''}`).then((r) => j<RecoResponse>(r)),
  qa: (query: string, sessionId: number | undefined, contextQuestionId?: string | null,
       onMeta?: (m: QaMeta) => void, onDelta?: (d: string) => void) =>
    qaStream(query, sessionId, contextQuestionId ?? null, onMeta, onDelta),
  spectrum: (sessionId: number) => fetch(`/api/spectrum/${sessionId}`).then((r) => j<SpectrumResponse>(r)),
  finish: (sessionId: number) =>
    fetch(`/api/session/${sessionId}/finish`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"finished":true}',
    }).then((r) => j<{ ok: boolean }>(r)),
  teacher: () => fetch('/api/teacher/summary').then((r) => j<TeacherSummary>(r)),
}
