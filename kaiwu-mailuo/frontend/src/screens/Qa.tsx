import { useState } from 'react'
import { useApp } from '../store'
import { api } from '../api'

interface QaResult { hit: boolean; answer: string; question_hint?: string; source_refs?: string[] }

const SUGGESTED = ['铁和钢的区别', '《天工开物》与新余', '凤凰山遗址', '钢水到钢板', '参观路线']

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
      setResult(await api.qa(query, session.id ?? undefined))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="eyebrow accent">追问 · 证据约束</div>
      <h2 className="h-page" style={{ marginTop: 12 }}>问</h2>

      <div className="qa-suggest">
        {SUGGESTED.map((s) => (
          <button key={s} className="qa-chip" onClick={() => { setQuery(s); ask(s) }}>{s}</button>
        ))}
      </div>

      <div className="qa-input-row">
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="输入问题…" onKeyDown={(e) => { if (e.key === 'Enter') ask(query) }} />
        <button disabled={busy} onClick={() => ask(query)}>问</button>
      </div>

      {result && (
        <div className="qa-result reco-card">
          {result.hit ? (
            <>
              <div className="r-body" style={{ marginTop: 0 }}>{result.answer}</div>
              {result.source_refs && (
                <div className="r-src"><b>来源</b>　{result.source_refs.map(evidenceTitle).join('；')}</div>
              )}
            </>
          ) : (
            <div className="qa-miss">{result.answer}</div>
          )}
        </div>
      )}
    </div>
  )
}
