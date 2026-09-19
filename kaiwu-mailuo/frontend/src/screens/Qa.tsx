import { useEffect, useState } from 'react'
import { useApp } from '../store'
import { api } from '../api'

interface QaResult {
  hit: boolean; answer: string
  question_hint?: string; source_refs?: string[]; suggestions?: string[]
}

const SUGGESTED = ['铁和钢的区别', '《天工开物》与新余', '凤凰山遗址', '钢水到钢板', '参观路线']

export default function Qa() {
  const { session, evidenceTitle, qaSeed, setQaSeed } = useApp()
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

  // 其他页面（考考你卡 / 造物问追问）预置的问题
  useEffect(() => {
    if (!qaSeed) return
    const q = qaSeed
    setQaSeed(null)
    setQuery(q)
    ask(q)
    window.scrollTo(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qaSeed])

  return (
    <div className="page">
      <div className="eyebrow accent">追问 · 证据约束</div>
      <h2 className="h-page" style={{ marginTop: 12 }}>问个开物</h2>

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
            <>
              <span className="qa-miss-tag">未收录 · 不编造</span>
              <div className="qa-miss">{result.answer}</div>
              {result.suggestions && result.suggestions.length > 0 && (
                <>
                  <div className="qa-sugg-label">你可以试着问</div>
                  <div className="qa-suggest">
                    {result.suggestions.map((s) => (
                      <button key={s} className="qa-chip" onClick={() => { setQuery(s); ask(s) }}>{s}</button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
