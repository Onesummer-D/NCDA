import { useState } from 'react'
import { useApp } from '../store'
import { api } from '../api'

interface QaResult { hit: boolean; answer: string; question_hint?: string; source_refs?: string[] }

const SUGGESTED = ['铁和钢有什么区别？', '《天工开物》和新余有什么关系？', '凤凰山遗址是什么年代的？', '钢水怎么变成钢板？', '在钢厂里可以自己走吗？']

export default function Qa() {
  const { session, evidenceTitle } = useApp()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<QaResult | null>(null)
  const [busy, setBusy] = useState(false)

  const ask = async (q: string) => {
    const query = q.trim()
    if (!query) return
    setBusy(true)
    try {
      const r = await api.qa(query, session.id ?? undefined)
      setResult(r)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="kicker">追问 · 证据约束</div>
      <h2 className="craft-title" style={{ fontSize: 24 }}>问一个工艺问题</h2>
      <p style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 6 }}>
        回答基于可追溯公开资料生成，并显示来源卡；资料库未覆盖的问题会明确说明，绝不自由发挥冶金史。
      </p>

      <div className="qa-chip-row">
        {SUGGESTED.map((s) => (
          <button key={s} className="qa-chip" onClick={() => { setQuery(s); ask(s) }}>{s}</button>
        ))}
      </div>

      <div className="qa-input-row">
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="输入你的问题…" onKeyDown={(e) => { if (e.key === 'Enter') ask(query) }} />
        <button disabled={busy} onClick={() => ask(query)}>问</button>
      </div>

      {result && (
        <div className={`qa-answer reco-card ${result.hit ? '' : 'qa-no-evidence'}`} style={{ borderLeftColor: result.hit ? 'var(--cinnabar)' : 'var(--ink-3)' }}>
          <div className="reco-kicker" style={{ color: result.hit ? 'var(--cinnabar)' : 'var(--ink-3)' }}>
            {result.hit ? '基于资料库回答' : '证据边界提示'}
          </div>
          <p style={{ marginTop: 8, color: 'var(--ink)' }}>{result.answer}</p>
          {result.hit && result.source_refs && (
            <div className="source-card">
              来源：<span className="src-title">{result.source_refs.map(evidenceTitle).join('；')}</span>
            </div>
          )}
        </div>
      )}

      <p className="note-ethical">
        设计说明：本演示版问答使用规则检索 + 知识库；正式版将接入 Evidence-grounded RAG（可替换 LLM Adapter），
        检索不到权威证据时不生成回答。
      </p>
    </div>
  )
}
