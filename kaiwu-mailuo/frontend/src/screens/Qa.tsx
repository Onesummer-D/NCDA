import { useEffect, useState } from 'react'
import { useApp } from '../store'
import { api } from '../api'
import { QA_HERO } from '../images'
import { QA_SUGGESTIONS, QA_DEFAULT_SUGGESTIONS } from '../qa'
import SpeakButton from '../components/SpeakButton'

interface QaResult {
  hit: boolean; answer: string
  question_hint?: string; source_refs?: string[]; suggestions?: string[]
}

export default function Qa() {
  const { session, evidenceTitle, qaContext, content, setCraftQi, setQaContext } = useApp()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<QaResult | null>(null)
  const [busy, setBusy] = useState(false)

  const ctxQuestion = content?.questions.find((q) => q.id === qaContext)
  const suggestions = (qaContext && QA_SUGGESTIONS[qaContext]) || QA_DEFAULT_SUGGESTIONS

  // 从造物问"再问一句"跳来时，左上角给一个原路返回的出口
  const backToCraft = () => {
    const idx = content?.questions.findIndex((q) => q.id === qaContext) ?? -1
    if (idx >= 0) setCraftQi(idx)   // 回到刚才看的那道造物问
    setQaContext(null)
    location.hash = '#/craft'
  }

  // DeepSeek 流式回答：先出「思考中」，随后逐字上屏
  const ask = (q: string) => {
    const text = q.trim()
    if (!text || busy) return
    setQuery(text)
    setBusy(true)
    setResult({ hit: true, answer: '' })
    api.qa(text, session.id ?? undefined, qaContext,
      (meta) => setResult((prev) => ({
        ...(prev ?? { hit: true, answer: '' }),
        ...meta,
        answer: meta.answer ?? prev?.answer ?? '',
      })),
      (d) => setResult((prev) => ({ ...(prev ?? { hit: true }), answer: (prev?.answer ?? '') + d })),
    ).catch(() => setResult({ hit: false, answer: '网络不太顺畅，请检查后再试一次。' }))
      .finally(() => setBusy(false))
  }

  // 每次带上下文跳转进来：清空上一轮问答，只给贴题建议，不自动提问
  useEffect(() => {
    if (qaContext == null) return
    setResult(null)
    setQuery('')
    window.scrollTo(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qaContext])

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="qa-hero">
        <img src={QA_HERO.src} alt="" />
        {qaContext && (
          <button className="qa-back" onClick={backToCraft}>← 返回造物问</button>
        )}
        <div className="qa-hero-info">
          <div className="qa-hero-title">问个开物</div>
        </div>
      </div>

      <div className="page" style={{ paddingTop: 20 }}>
        {ctxQuestion && (
          <div className="qa-ctx-label">关于「{ctxQuestion.code} · {ctxQuestion.title}」你可以先问：</div>
        )}
        {!ctxQuestion && <div className="qa-ctx-label">你可以先问：</div>}

        <div className="qa-ask-list">
          {suggestions.map((s) => (
            <button key={s} className="qa-ask-row" onClick={() => { setQuery(s); ask(s) }}>
              {s}
              <span>→</span>
            </button>
          ))}
        </div>

        <div className="qa-input-row" style={{ position: 'static', marginTop: 20 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="或者输入你自己的问题…" onKeyDown={(e) => { if (e.key === 'Enter') ask(query) }} />
          <button disabled={busy} onClick={() => ask(query)}>问</button>
        </div>

        {result && (
          <div className="qa-result reco-card">
            {result.hit ? (
              <>
                <div className="r-body" style={{ marginTop: 0 }}>
                  {result.answer || <span className="qa-thinking">{busy ? '思考中…' : ''}</span>}
                </div>
                <div className="qa-answer-foot">
                  {result.source_refs && result.answer && (
                    <div className="r-src" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
                      <b>来源</b>　{result.source_refs.map(evidenceTitle).join('；')}
                    </div>
                  )}
                  {result.answer && <SpeakButton text={result.answer} />}
                </div>
              </>
            ) : (
              <>
                <span className="qa-miss-tag">未收录</span>
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
    </div>
  )
}
