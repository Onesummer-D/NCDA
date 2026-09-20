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
    }).then((r) => j<{ ok: boolean }>(r)),
  recommend: (sessionId: number, nodeId?: string) =>
    fetch(`/api/recommend/${sessionId}${nodeId ? `?node_id=${nodeId}` : ''}`).then((r) => j<RecoResponse>(r)),
  qa: (query: string, sessionId?: number) =>
    fetch('/api/qa', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, session_id: sessionId }),
    }).then((r) => j<{ hit: boolean; answer: string; question_hint?: string; source_refs?: string[]; suggestions?: string[] }>(r)),
  spectrum: (sessionId: number) => fetch(`/api/spectrum/${sessionId}`).then((r) => j<SpectrumResponse>(r)),
  finish: (sessionId: number) =>
    fetch(`/api/session/${sessionId}/finish`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"finished":true}',
    }).then((r) => j<{ ok: boolean }>(r)),
  teacher: () => fetch('/api/teacher/summary').then((r) => j<TeacherSummary>(r)),
}
